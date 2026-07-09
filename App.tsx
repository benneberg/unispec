
import React, { useState, useEffect } from 'react';
import { WorkspaceProvider, useWorkspace } from './contexts/WorkspaceContext';
import { type Variant, type ApiConfig, type QAMessage } from './types';
import * as llmService from './services/llmService';
import { classifyArtifacts, generateSpecFromArtifacts, consolidateRegistry } from './knowledge/classifier';
import { GitBranch, Zap, Info } from './components/Icons';
import WorkspaceSetup from './components/WorkspaceSetup';
import AddVariants from './components/AddVariants';
import VariantCard from './components/VariantCard';
import VariantDetailsModal from './components/VariantDetailsModal';
import ApiConfigModal from './components/ApiConfigModal';
import ErrorMessage from './components/ErrorMessage';
import LoadingOverlay from './components/LoadingOverlay';
import ComparisonResults from './components/ComparisonResults';
import ComparisonResultsDisplay from './components/ComparisonResultsDisplay';
import ConsolidatedDocsDisplay from './components/ConsolidatedDocsDisplay';
import AgentControl from './components/AgentControl';
import AboutModal from './components/AboutModal';
import ConflictReport from './components/ConflictReport';
import PipelineView from './components/PipelineView';
import DeveloperQAModal from './components/DeveloperQAModal';
import ExportModal from './components/ExportModal';
import { useAgent } from './hooks/useAgent';

const AppContent: React.FC = () => {
  const { state, dispatch } = useWorkspace();
  const { 
    currentWorkspace, 
    loading, 
    loadingMessage, 
    error, 
    agentStatus, 
    agentLog, 
    comparisonData, 
    normalizationResult,
    consolidatedDocs,
    activeStep 
  } = state;

  // UI-specific state remains in the component
  const [apiConfig, setApiConfig] = useState<ApiConfig>({
    provider: 'groq',
    apiKey: '',
    model: 'mixtral-8x7b-32768'
  });
  const [showApiConfig, setShowApiConfig] = useState<boolean>(false);
  const [showAboutModal, setShowAboutModal] = useState<boolean>(false);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [showQAModal, setShowQAModal] = useState<boolean>(false);
  const [qaMessages, setQAMessages] = useState<QAMessage[]>([]);
  const [isQALoading, setIsQALoading] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);

  const setLoading = (isLoading: boolean, message = 'Processing...') => {
    dispatch({ type: 'SET_LOADING', payload: { loading: isLoading, message } });
  };
  
  const setError = (errorMessage: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: errorMessage });
  };
  
  const handleFileUpload = async (file: File, variantName: string) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        dispatch({
          type: 'ADD_VARIANT',
          payload: {
            name: variantName || file.name,
            sourceType: 'upload',
            rawContent: event.target.result,
            fileName: file.name
          }
        });
      }
    };
    reader.readAsText(file);
  };

  const handleGithubClone = async (repoUrl: string, variantName: string) => {
    setLoading(true, 'Cloning repository via secure backend service...');
    setError(null);
    try {
      const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (!match) throw new Error('Invalid GitHub URL format. Use https://github.com/owner/repo');
      
      const [, owner, repo] = match;
      const cleanRepo = repo.replace('.git', '');
      
      const response = await fetch('/api/github/clone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ owner, repo: cleanRepo })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Cloning failed with status: ${response.status}`);
      }

      const cloneResult = await response.json();

      dispatch({
        type: 'ADD_VARIANT',
        payload: {
          name: variantName || cleanRepo,
          sourceType: 'github',
          rawContent: JSON.stringify(cloneResult.files, null, 2),
          repoUrl,
          owner,
          repo: cleanRepo
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred while cloning the repository.');
    } finally {
      setLoading(false);
    }
  };

  const addVariant = (variantData: Omit<Variant, 'id' | 'extractedSpecs' | 'extractionProgress' | 'totalExtractionSteps'>) => {
    dispatch({ type: 'ADD_VARIANT', payload: variantData });
  };
  
  const extractSpecs = async (variant: Variant) => {
    if (!apiConfig.apiKey) {
      setShowApiConfig(true);
      setError('Please configure your API key in the settings before proceeding.');
      return;
    }

    setLoading(true);
    let currentVariant = { ...variant };
    
    const isRepo = variant.totalExtractionSteps === 5;
    const stages = isRepo ? ['summarize', 'low-level', 'mid-level', 'high-level', 'semantic-classification'] : ['low-level', 'mid-level', 'high-level', 'semantic-classification'];
    let analysisInput = variant.rawContent;

    try {
        for (let i = 0; i < stages.length; i++) {
            const stage = stages[i];
            const progress = i + 1;
            setLoading(true, `Analyzing ${currentVariant.name} - Pass ${progress}/${stages.length}: ${stage.replace('-', ' ')}...`);
            
            let updatedSpecs = currentVariant.extractedSpecs || { pipelineResults: {} };

            switch (stage) {
                case 'summarize':
                    analysisInput = await llmService.runRepositorySummary(currentVariant, apiConfig);
                    updatedSpecs = { pipelineResults: {}, repositorySummary: analysisInput };
                    break;
                case 'low-level':
                    const lowLevel = await llmService.runLowLevelExtraction(analysisInput, currentVariant, apiConfig);
                    if (!updatedSpecs.pipelineResults) updatedSpecs.pipelineResults = {};
                    updatedSpecs.pipelineResults.lowLevel = lowLevel;
                    break;
                case 'mid-level':
                    if (!updatedSpecs.pipelineResults?.lowLevel) {
                        throw new Error(`Mid-level analysis requires low-level extraction data for ${currentVariant.name}`);
                    }
                    const midLevel = await llmService.runMidLevelSynthesis(updatedSpecs.pipelineResults.lowLevel, currentVariant, apiConfig);
                    updatedSpecs.pipelineResults.midLevel = midLevel;
                    break;
                case 'high-level':
                    if (!updatedSpecs.pipelineResults?.midLevel) {
                         throw new Error(`High-level analysis requires mid-level synthesis data for ${currentVariant.name}`);
                    }
                    const highLevel = await llmService.runHighLevelIntent(updatedSpecs.pipelineResults.midLevel, currentVariant, apiConfig);
                    updatedSpecs.pipelineResults.highLevel = highLevel;
                    break;
                case 'semantic-classification':
                    if (!updatedSpecs.pipelineResults) {
                         throw new Error(`Semantic classification requires previous extraction results for ${currentVariant.name}`);
                    }
                    const extractedContext = JSON.stringify(updatedSpecs.pipelineResults);
                    const artifacts = await classifyArtifacts(extractedContext, currentVariant.id, apiConfig);
                    currentVariant.knowledgeArtifacts = artifacts;
                    
                    const finalSpecs = generateSpecFromArtifacts(artifacts);
                    updatedSpecs = { ...updatedSpecs, ...finalSpecs };
                    break;
            }
            
            currentVariant.extractionProgress = progress;
            currentVariant.extractedSpecs = updatedSpecs;
            dispatch({ type: 'UPDATE_VARIANT', payload: currentVariant });
        }
    } catch (err) {
      const errorMessage = `Analysis pipeline failed for ${currentVariant.name}: ${err instanceof Error ? err.message : String(err)}`;
      currentVariant.extractionProgress = 0; // Reset progress on failure
      dispatch({ type: 'UPDATE_VARIANT', payload: currentVariant });
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const runComparisonAndNormalization = async () => {
    if (!currentWorkspace || !currentWorkspace.variants.every(v => v.extractionProgress === v.totalExtractionSteps)) {
      throw new Error('Please complete the analysis for all variants first.');
    }
    setLoading(true);
    
    try {
      setLoading(true, 'Comparing variant Knowledge Artifacts...');
      const comparison = await llmService.compareVariants(currentWorkspace.variants, apiConfig);
      dispatch({ type: 'SET_COMPARISON_DATA', payload: comparison });

      setLoading(true, 'Detecting conflicts & normalizing specifications...');
      const normalization = await llmService.detectAndNormalize(currentWorkspace.variants, comparison, apiConfig);
      dispatch({ type: 'SET_NORMALIZATION_RESULT', payload: normalization });

      setLoading(true, 'Building global Knowledge Artifact Registry & Evolution Reports...');
      const registry = await consolidateRegistry(currentWorkspace.variants, apiConfig);
      
      const updatedWorkspace = {
        ...currentWorkspace,
        knowledgeArtifacts: registry.artifacts,
        evolutionReports: registry.evolutionReports
      };
      dispatch({ type: 'UPDATE_WORKSPACE', payload: updatedWorkspace });

      dispatch({ type: 'SET_ACTIVE_STEP', payload: 4 });
    } catch (err) {
       throw new Error(`Comparison & Normalization failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };
  
  const consolidateSpecs = async () => {
     if (!currentWorkspace || !comparisonData || !normalizationResult) {
      throw new Error('Comparison or normalization data is missing.');
    }
    setLoading(true, 'Generating master documentation...');
    try {
      const docs = await llmService.consolidateSpecifications(currentWorkspace.variants, comparisonData, normalizationResult, apiConfig);
      dispatch({ type: 'SET_CONSOLIDATED_DOCS', payload: docs });
      dispatch({ type: 'SET_ACTIVE_STEP', payload: 5 });
    } catch (err) {
       throw new Error(`Consolidation failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const generateDiagramsAndBlueprint = async () => {
    if (!consolidatedDocs) {
      throw new Error('Consolidated documents are required to generate visuals.');
    }
    setLoading(true, 'Generating architecture diagrams & blueprint...');
    try {
      const visuals = await llmService.generateVisualsAndBlueprint(consolidatedDocs, apiConfig);
      const updatedDocs = { ...consolidatedDocs, ...visuals };
      dispatch({ type: 'SET_CONSOLIDATED_DOCS', payload: updatedDocs });
      dispatch({ type: 'SET_ACTIVE_STEP', payload: 6 });
    } catch (err) {
      throw new Error(`Diagram & Blueprint generation failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };
  
  const runValidation = async () => {
    if (!consolidatedDocs || !currentWorkspace) {
      throw new Error('Consolidated documents and workspace are required for validation.');
    }
    setLoading(true, 'Running round-trip validation...');
    try {
      const report = await llmService.runRoundTripValidation(consolidatedDocs, currentWorkspace.variants, apiConfig);
      const updatedDocs = { ...consolidatedDocs, validationReport: report };
      dispatch({ type: 'SET_CONSOLIDATED_DOCS', payload: updatedDocs });
      dispatch({ type: 'SET_ACTIVE_STEP', payload: 7 });
    } catch (err) {
      throw new Error(`Validation failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const startAgent = () => {
    if (currentWorkspace && currentWorkspace.variants.length > 1) {
        dispatch({ type: 'START_AGENT' });
    } else {
        setError("Please add at least two variants to start the autonomous workflow.");
    }
  };
  
  const handleQASubmit = async (question: string) => {
    if (!question.trim() || isQALoading || !currentWorkspace) return;

    const newMessages: QAMessage[] = [...qaMessages, { role: 'user', content: question }];
    setQAMessages(newMessages);
    setIsQALoading(true);
    setError(null);

    try {
        const answer = await llmService.runQAndA(
            question,
            {
                variants: currentWorkspace.variants,
                comparison: comparisonData,
                normalization: normalizationResult,
                docs: consolidatedDocs,
            },
            apiConfig
        );
        setQAMessages([...newMessages, { role: 'model', content: answer }]);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred in Q&A.";
        setError(errorMessage);
        setQAMessages([...newMessages, { role: 'model', content: `Error: ${errorMessage}` }]);
    } finally {
        setIsQALoading(false);
    }
  };

  // Initialize the Autonomous Agent
  useAgent(
    apiConfig,
    extractSpecs,
    runComparisonAndNormalization,
    consolidateSpecs,
    generateDiagramsAndBlueprint,
    runValidation,
    setError,
    setLoading
  );
  
  const downloadFile = (content: string, filename: string) => {
    if (content) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
  };

  const handleExport = (template: string) => {
    if (!consolidatedDocs) return;

    if (template === 'all') {
        const files: { [key: string]: string } = {
            'PRD.md': consolidatedDocs.prd || '',
            'Architecture.md': consolidatedDocs.architecture || '',
            'Modules.md': consolidatedDocs.modules || '',
            'Data-Model.md': consolidatedDocs.dataModel || '',
            'Design-Decisions.md': consolidatedDocs.decisions || '',
            'Migration-Plan.md': consolidatedDocs.migration || '',
            'Knowledge-Artifact-Map.md': consolidatedDocs.architectureDiagrams?.knowledgeHierarchical ? '```mermaid\n' + consolidatedDocs.architectureDiagrams.knowledgeHierarchical + '\n```' : '',
            'C4-Diagram.md': consolidatedDocs.architectureDiagrams?.c4 ? '```mermaid\n' + consolidatedDocs.architectureDiagrams.c4 + '\n```' : '',
            'Sequence-Diagram.md': consolidatedDocs.architectureDiagrams?.sequence ? '```mermaid\n' + consolidatedDocs.architectureDiagrams.sequence + '\n```' : '',
            'Schema-Diagram.md': consolidatedDocs.architectureDiagrams?.schema ? '```mermaid\n' + consolidatedDocs.architectureDiagrams.schema + '\n```' : '',
            'Blueprint-Folder-Structure.txt': consolidatedDocs.implementationBlueprint?.folderStructure || '',
            'Blueprint-package.json': consolidatedDocs.implementationBlueprint?.packageJson || '',
            'Blueprint-Types.ts': consolidatedDocs.implementationBlueprint?.typeDefinitions || '',
            'Blueprint-APIs.ts': consolidatedDocs.implementationBlueprint?.apiSkeletons || '',
            'Validation-Report.md': consolidatedDocs.validationReport ? 
                `# Validation Report\n\n**Summary:** ${consolidatedDocs.validationReport.summary}\n\n` +
                 consolidatedDocs.validationReport.findings.map(f => `## ${f.type.toUpperCase()}: ${f.area} (from ${f.variant})\n- ${f.finding}`).join('\n\n')
                : '',
        };
        Object.entries(files).forEach(([filename, content]) => downloadFile(content, filename));
    } else if (template === 'prd') {
        let content = `# Product Requirements Document: ${currentWorkspace?.name || 'Consolidated App'}\n\n`;
        content += consolidatedDocs.prd || 'No PRD content generated.';
        content += '\n\n---\n\n# Key Design Decisions\n\n';
        content += consolidatedDocs.decisions || 'No design decisions were logged.';
        downloadFile(content, 'PRD.md');
    } else if (template === 'tdd') {
        let content = `# Technical Design Document: ${currentWorkspace?.name || 'Consolidated App'}\n\n`;
        content += '## 1. System Architecture & Knowledge Map\n\n' + (consolidatedDocs.architecture || 'Not specified.');
        if (consolidatedDocs.architectureDiagrams?.knowledgeHierarchical) content += '\n\n### Hierarchical Knowledge Artifact Map\n\n```mermaid\n' + consolidatedDocs.architectureDiagrams.knowledgeHierarchical + '\n```';
        if (consolidatedDocs.architectureDiagrams?.c4) content += '\n\n### C4 Container Diagram\n\n```mermaid\n' + consolidatedDocs.architectureDiagrams.c4 + '\n```';
        if (consolidatedDocs.architectureDiagrams?.sequence) content += '\n\n### Primary Sequence Diagram\n\n```mermaid\n' + consolidatedDocs.architectureDiagrams.sequence + '\n```';
        content += '\n\n## 2. Modules & Subsystems\n\n' + (consolidatedDocs.modules || 'Not specified.');
        content += '\n\n## 3. Data Model\n\n' + (consolidatedDocs.dataModel || 'Not specified.');
        if (consolidatedDocs.architectureDiagrams?.schema) content += '\n\n### Data Schema (ERD)\n\n```mermaid\n' + consolidatedDocs.architectureDiagrams.schema + '\n```';
        content += '\n\n## 4. Key Design Decisions\n\n' + (consolidatedDocs.decisions || 'Not specified.');
        downloadFile(content, 'Technical-Design-Document.md');
    } else if (template === 'api') {
        let content = `# API Contract: ${currentWorkspace?.name || 'Consolidated App'}\n\n`;
        content += '## 1. Type Definitions\n\n```typescript\n' + (consolidatedDocs.implementationBlueprint?.typeDefinitions || 'No types defined.') + '\n```';
        content += '\n\n## 2. API Skeletons\n\n```typescript\n' + (consolidatedDocs.implementationBlueprint?.apiSkeletons || 'No API skeletons defined.') + '\n```';
        downloadFile(content, 'API-Contract.md');
    } else if (template === 'roadmap') {
        let content = `# Implementation Roadmap: ${currentWorkspace?.name || 'Consolidated App'}\n\n`;
        content += '## 1. Migration Plan\n\n' + (consolidatedDocs.migration || 'Not specified.');
        content += '\n\n## 2. Proposed Folder Structure\n\n```\n' + (consolidatedDocs.implementationBlueprint?.folderStructure || 'Not specified.') + '\n```';
        content += '\n\n## 3. Initial `package.json`\n\n```json\n' + (consolidatedDocs.implementationBlueprint?.packageJson || '{}') + '\n```';
        downloadFile(content, 'Implementation-Roadmap.md');
    }
    
    setShowExportModal(false);
  };
  
  const analyzedVariantsCount = currentWorkspace?.variants.filter(v => v.extractionProgress === v.totalExtractionSteps).length || 0;
  const isAgentRunning = agentStatus !== 'idle' && agentStatus !== 'complete' && agentStatus !== 'error';

  return (
    <div className="min-h-screen font-sans selection:bg-blue-100 selection:text-blue-900">
      <header className="border-b border-slate-200/60 bg-[#F0F2F5]/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 flex items-center justify-center rounded-2xl soft-out bg-white">
              <GitBranch className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-slate-800">UniSpec</h1>
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Merger Studio</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
                onClick={() => setShowAboutModal(true)}
                className="w-10 h-10 flex items-center justify-center soft-button rounded-xl text-slate-600 hover:text-blue-600"
                aria-label="About App Merger Studio"
            >
                <Info className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowApiConfig(true)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20 flex items-center gap-2 text-sm font-semibold transition-all active:scale-95"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Configure Engine</span>
            </button>
          </div>
        </div>
      </header>

      {showApiConfig && (
        <ApiConfigModal
          config={apiConfig}
          onSave={(newConfig) => {
            setApiConfig(newConfig);
            setShowApiConfig(false);
            setError(null);
          }}
          onClose={() => setShowApiConfig(false)}
        />
      )}
      
      {showAboutModal && <AboutModal onClose={() => setShowAboutModal(false)} />}
      
      {showQAModal && (
        <DeveloperQAModal
          messages={qaMessages}
          isLoading={isQALoading}
          onSubmit={handleQASubmit}
          onClose={() => setShowQAModal(false)}
        />
      )}

      {showExportModal && consolidatedDocs && (
        <ExportModal
            docs={consolidatedDocs}
            onClose={() => setShowExportModal(false)}
            onExport={handleExport}
        />
      )}

      {error && <ErrorMessage message={error} onClose={() => setError(null)} />}

      <main className="max-w-7xl mx-auto px-6 py-10">
        {!currentWorkspace ? (
          <WorkspaceSetup onCreateWorkspace={(name) => dispatch({ type: 'CREATE_WORKSPACE', payload: name })} />
        ) : (
          <div className="space-y-10">
            <div className="soft-out rounded-3xl p-8 bg-white/50 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8">
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">Active Portfolio</p>
                    <p className="text-2xl font-black font-display text-blue-600">{currentWorkspace.variants.length}</p>
                  </div>
               </div>
              <h2 className="text-3xl font-black font-display tracking-tight text-slate-800 mb-2">{currentWorkspace.name}</h2>
              <div className="flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                 <p className="text-sm font-medium text-slate-500">Workspace ready for analysis</p>
              </div>
            </div>
            
            <PipelineView 
                workspace={currentWorkspace}
                agentStatus={agentStatus}
                error={!!error}
            />

            {activeStep === 1 && (
              <AddVariants
                onFileUpload={handleFileUpload}
                onGithubClone={handleGithubClone}
                onManualSpec={addVariant}
                loading={loading}
              />
            )}
            
            {activeStep === 2 && currentWorkspace.variants.length > 0 && (
                <AgentControl
                    status={agentStatus}
                    log={agentLog}
                    onStart={startAgent}
                    variantsCount={currentWorkspace.variants.length}
                    analyzedVariantsCount={analyzedVariantsCount}
                />
            )}

            {currentWorkspace.variants.length > 0 && (
              <div className="soft-out rounded-3xl p-8 bg-white/30">
                <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Application Variants</h3>
                    <p className="text-sm text-slate-500">Add or manage source variants for merging</p>
                  </div>
                  {activeStep === 1 && (
                    <button
                      onClick={() => dispatch({ type: 'SET_ACTIVE_STEP', payload: 2 })}
                      className="px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                      Process & Analyze
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {currentWorkspace.variants.map(variant => (
                    <VariantCard
                      key={variant.id}
                      variant={variant}
                      onDelete={() => dispatch({ type: 'DELETE_VARIANT', payload: variant.id })}
                      onExtract={() => extractSpecs(variant)}
                      onView={() => setSelectedVariant(variant)}
                      isAgentRunning={isAgentRunning}
                      loading={loading}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {activeStep === 3 && agentStatus === 'idle' && (
                <ComparisonResults onCompare={runComparisonAndNormalization} loading={loading} />
            )}
            
            {activeStep >= 4 && (
              <div className="space-y-6">
                {comparisonData && <ComparisonResultsDisplay data={comparisonData} />}
                {normalizationResult && (
                  <ConflictReport 
                    result={normalizationResult} 
                    onConsolidate={consolidateSpecs} 
                    loading={loading}
                    isAgentRunning={isAgentRunning}
                    isConsolidationDone={!!consolidatedDocs}
                  />
                )}
              </div>
            )}

            {consolidatedDocs && activeStep >= 5 && (
              <ConsolidatedDocsDisplay 
                docs={consolidatedDocs} 
                onShowExportModal={() => setShowExportModal(true)}
                onGenerateVisuals={generateDiagramsAndBlueprint}
                onRunValidation={runValidation}
                onAskArchitect={() => {
                    setQAMessages([]);
                    setShowQAModal(true);
                }}
                loading={loading}
              />
            )}
            
          </div>
        )}
      </main>

      {selectedVariant && (
        <VariantDetailsModal
          variant={selectedVariant}
          onClose={() => setSelectedVariant(null)}
        />
      )}
      
      {loading && <LoadingOverlay message={loadingMessage} />}
    </div>
  );
};


const App: React.FC = () => {
  return (
    <WorkspaceProvider>
      <AppContent />
    </WorkspaceProvider>
  );
};

export default App;
