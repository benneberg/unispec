
import React, { useState, useEffect } from 'react';
import { WorkspaceProvider, useWorkspace } from './contexts/WorkspaceContext';
import { type Variant, type ApiConfig, type QAMessage } from './types';
import * as llmService from './services/llmService';
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
    setLoading(true, 'Cloning repository...');
    setError(null);
    try {
      const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (!match) throw new Error('Invalid GitHub URL format. Use https://github.com/owner/repo');
      
      const [, owner, repo] = match;
      const cleanRepo = repo.replace('.git', '');
      
      const repoInfoRes = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}`);
      if (!repoInfoRes.ok) throw new Error(`Could not fetch repo info. Status: ${repoInfoRes.status}`);
      const repoInfo = await repoInfoRes.json();
      const defaultBranch = repoInfo.default_branch;

      const treeRes = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/git/trees/${defaultBranch}?recursive=1`);
      if (!treeRes.ok) throw new Error(`Could not fetch repo file tree. Status: ${treeRes.status}`);
      const treeData = await treeRes.json();
      
      if (treeData.truncated) {
        console.warn('Repository tree is truncated by GitHub API. Not all files will be processed.');
      }

      const filesToFetch = treeData.tree
        .filter((item: { type: string, path: string }) => item.type === 'blob' && !/\.(jpg|jpeg|png|gif|svg|ico|woff|woff2|ttf|eot|pdf|zip|gz|lock|DS_Store)$/i.test(item.path))
        .slice(0, 75); // Limit to 75 files

      const fileContents: { [key: string]: string } = {};

      await Promise.all(filesToFetch.map(async (file: { url: string, path: string }) => {
        const fileRes = await fetch(file.url);
        if (!fileRes.ok) {
          console.warn(`Could not fetch file: ${file.path}`);
          return;
        }
        const blobData = await fileRes.json();
        if (blobData.encoding === 'base64') {
          try {
            const decodedContent = atob(blobData.content);
            fileContents[file.path] = decodedContent;
          } catch (e) {
            console.error(`Error decoding base64 content for ${file.path}`, e);
            fileContents[file.path] = "[Error: Could not decode content]";
          }
        } else if (blobData.content) {
          fileContents[file.path] = blobData.content;
        }
      }));

      dispatch({
        type: 'ADD_VARIANT',
        payload: {
          name: variantName || cleanRepo,
          sourceType: 'github',
          rawContent: JSON.stringify(fileContents, null, 2),
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
    const stages = isRepo ? ['summarize', 'low-level', 'mid-level', 'high-level', 'final'] : ['low-level', 'mid-level', 'high-level', 'final'];
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
                    updatedSpecs.pipelineResults!.lowLevel = lowLevel;
                    break;
                case 'mid-level':
                    const midLevel = await llmService.runMidLevelSynthesis(updatedSpecs!.pipelineResults!.lowLevel!, currentVariant, apiConfig);
                    updatedSpecs.pipelineResults!.midLevel = midLevel;
                    break;
                case 'high-level':
                    const highLevel = await llmService.runHighLevelIntent(updatedSpecs!.pipelineResults!.midLevel!, currentVariant, apiConfig);
                    updatedSpecs.pipelineResults!.highLevel = highLevel;
                    break;
                case 'final':
                    const finalSpecs = await llmService.runFinalSpecBuild(updatedSpecs.pipelineResults!, currentVariant, apiConfig);
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
      setLoading(true, 'Comparing variants...');
      const comparison = await llmService.compareVariants(currentWorkspace.variants, apiConfig);
      dispatch({ type: 'SET_COMPARISON_DATA', payload: comparison });

      setLoading(true, 'Detecting conflicts & normalizing specs...');
      const normalization = await llmService.detectAndNormalize(currentWorkspace.variants, comparison, apiConfig);
      dispatch({ type: 'SET_NORMALIZATION_RESULT', payload: normalization });

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

  // Agent State Machine
  useEffect(() => {
      if (agentStatus === 'idle' || agentStatus === 'complete' || agentStatus === 'error') {
          if(loading) setLoading(false);
          return;
      }

      const runNextTask = async () => {
          setError(null);
          try {
              if (agentStatus === 'analyzing') {
                  if (!currentWorkspace) throw new Error("Workspace not found.");
                  const nextVariant = currentWorkspace.variants.find(v => v.extractionProgress < v.totalExtractionSteps);
                  
                  if (nextVariant) {
                      dispatch({ type: 'ADD_AGENT_LOG', payload: `Analyzing variant: ${nextVariant.name}`});
                      await extractSpecs(nextVariant);
                      dispatch({ type: 'ADD_AGENT_LOG', payload: `Analysis for ${nextVariant.name} complete.`});
                  } else {
                      dispatch({ type: 'ADD_AGENT_LOG', payload: "All variants analyzed successfully."});
                      dispatch({ type: 'SET_AGENT_STATUS', payload: 'comparing_normalizing' });
                  }
              } else if (agentStatus === 'comparing_normalizing') {
                  if (!currentWorkspace || !currentWorkspace.variants.every(v => v.extractionProgress === v.totalExtractionSteps)) {
                    throw new Error('Assertion failed: Not all variants analyzed before comparison.');
                  }
                  dispatch({ type: 'ADD_AGENT_LOG', payload: "Comparing variants and normalizing models..."});
                  await runComparisonAndNormalization();
                  dispatch({ type: 'ADD_AGENT_LOG', payload: "Comparison and normalization complete."});
                  dispatch({ type: 'SET_AGENT_STATUS', payload: 'consolidating' });
              } else if (agentStatus === 'consolidating') {
                  if (!comparisonData || !normalizationResult) {
                      throw new Error('Assertion failed: No comparison/normalization data for consolidation.');
                  }
                  dispatch({ type: 'ADD_AGENT_LOG', payload: "Consolidating specifications..."});
                  await consolidateSpecs();
                  dispatch({ type: 'ADD_AGENT_LOG', payload: "Consolidation complete."});
                  dispatch({ type: 'SET_AGENT_STATUS', payload: 'generating_visuals' });
              } else if (agentStatus === 'generating_visuals') {
                  if (!consolidatedDocs) {
                      throw new Error('Assertion failed: No consolidated docs for visuals generation.');
                  }
                  dispatch({ type: 'ADD_AGENT_LOG', payload: "Generating diagrams and code blueprint..."});
                  await generateDiagramsAndBlueprint();
                  dispatch({ type: 'ADD_AGENT_LOG', payload: "Visuals and blueprint generation complete."});
                  dispatch({ type: 'SET_AGENT_STATUS', payload: 'validating' });
              } else if (agentStatus === 'validating') {
                  if (!consolidatedDocs) {
                      throw new Error('Assertion failed: No consolidated docs for validation.');
                  }
                  dispatch({ type: 'ADD_AGENT_LOG', payload: "Running round-trip validation..."});
                  await runValidation();
                  dispatch({ type: 'ADD_AGENT_LOG', payload: "Validation complete. Workflow finished."});
                  dispatch({ type: 'SET_AGENT_STATUS', payload: 'complete' });
              }
          } catch (e) {
              const errorMessage = e instanceof Error ? e.message : String(e);
              setError(errorMessage);
              dispatch({ type: 'ADD_AGENT_LOG', payload: `ERROR: ${errorMessage}`});
              dispatch({ type: 'SET_AGENT_STATUS', payload: 'error' });
          }
      };

      runNextTask();
  }, [agentStatus, currentWorkspace]);
  
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
        content += '## 1. System Architecture\n\n' + (consolidatedDocs.architecture || 'Not specified.');
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
    <div className="min-h-screen">
      <header className="border-b border-purple-500/20 bg-black/20 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <GitBranch className="w-8 h-8 text-purple-400" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">App Merger Studio</h1>
              <p className="text-xs sm:text-sm text-purple-300">Unify Multiple Apps into One Spec</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
                onClick={() => setShowAboutModal(true)}
                className="p-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg"
                aria-label="About App Merger Studio"
            >
                <Info className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowApiConfig(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center gap-2 text-sm sm:text-base"
            >
              <Zap className="w-4 h-4" />
              Configure API
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

      <main className="max-w-7xl mx-auto px-4 py-8">
        {!currentWorkspace ? (
          <WorkspaceSetup onCreateWorkspace={(name) => dispatch({ type: 'CREATE_WORKSPACE', payload: name })} />
        ) : (
          <div className="space-y-6">
            <div className="bg-slate-800/50 rounded-xl p-6 border border-purple-500/20">
              <h2 className="text-2xl font-bold mb-2">{currentWorkspace.name}</h2>
              <p className="text-purple-300">Variants: {currentWorkspace.variants.length}</p>
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
              <div className="bg-slate-800/50 rounded-xl p-6 border border-purple-500/20">
                <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                  <h3 className="text-xl font-bold">Variants</h3>
                  {activeStep === 1 && (
                    <button
                      onClick={() => dispatch({ type: 'SET_ACTIVE_STEP', payload: 2 })}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg"
                    >
                      Continue to Spec Analysis
                    </button>
                  )}
                </div>
                <div className="space-y-3">
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
