import React, { useState } from 'react';
import { type KnowledgeArtifact } from '../knowledge/types';
import { type UnificationManifest } from '../tools/unifier/types';
import { type ApiConfig } from '../types';
import { useWorkspace } from '../contexts/WorkspaceContext';
import JSZip from 'jszip';
import { 
  GitMerge, Sparkles, Loader2, Info, AlertTriangle, 
  CheckCircle, FileCode, Copy, Download, Box, 
  ChevronRight, ClipboardList, Cable, AlertCircle
} from './Icons';

interface UnifierToolDisplayProps {
  artifacts: KnowledgeArtifact[];
  manifest: UnificationManifest | null | undefined;
  onGenerateManifest: (explicitExtractions: string[]) => Promise<void>;
  loading: boolean;
  loadingMessage?: string;
  apiConfig: ApiConfig;
}

const UnifierToolDisplay: React.FC<UnifierToolDisplayProps> = ({
  artifacts,
  manifest,
  onGenerateManifest,
  loading,
  loadingMessage = 'Unifying variants...',
  apiConfig
}) => {
  const { state } = useWorkspace();
  const { currentWorkspace } = state;

  const [selectedExtractions, setSelectedExtractions] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'decisions' | 'standalone' | 'warnings' | 'json'>('decisions');
  const [isCopied, setIsCopied] = useState(false);
  const [extractingBundleId, setExtractingBundleId] = useState<string | null>(null);

  const toggleExtraction = (id: string) => {
    setSelectedExtractions(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleRunUnifier = () => {
    onGenerateManifest(selectedExtractions);
  };

  const handleExportBundle = async (mod: { artifactId: string; reason: string }) => {
    if (!currentWorkspace || !apiConfig) return;
    setExtractingBundleId(mod.artifactId);

    try {
      const artifact = artifacts.find(a => a.id === mod.artifactId);
      if (!artifact) {
        throw new Error(`Artifact ${mod.artifactId} not found in the registry.`);
      }

      const sourceVariantId = artifact.implementations?.[0]?.repositoryId;
      const sourceVariant = currentWorkspace.variants.find(v => v.id === sourceVariantId || v.name === sourceVariantId);
      if (!sourceVariant) {
        throw new Error(`Source variant for artifact ${artifact.name} is missing.`);
      }

      let variantFiles: Record<string, string> = {};
      try {
        variantFiles = JSON.parse(sourceVariant.rawContent);
      } catch (e) {
        variantFiles = { [sourceVariant.fileName || 'spec.md']: sourceVariant.rawContent };
      }

      const response = await fetch('/api/extract-bundle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artifact, variantFiles, apiConfig })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Server extraction failed with status ${response.status}`);
      }

      const bundleResult = await response.json();
      const zip = new JSZip();

      const codeFolder = zip.folder('src');
      for (const file of bundleResult.files || []) {
        const relativePath = file.path.replace(/^(src\/|lib\/|components\/)/, '');
        codeFolder?.file(relativePath, file.content);
      }

      const readmeContent = `
# Independent Decoupled Module: ${bundleResult.artifactName}

## Purpose
${artifact.purpose}

---

## Interface Contract (Consumption Details)
${bundleResult.interfaceContract}

---

## Installation & Environment Configuration
${bundleResult.installNotes}

---

*Isolated & compiled automatically by UniSpec Unified Portfolio Integrator.*
`;
      zip.file('README.md', readmeContent.trim());

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${bundleResult.artifactName.toLowerCase().replace(/\s+/g, '-')}-standalone-package.zip`;
      link.click();
      URL.revokeObjectURL(url);

    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : 'Failed to export standalone package.');
    } finally {
      setExtractingBundleId(null);
    }
  };

  const handleCopyJson = () => {
    if (!manifest) return;
    navigator.clipboard.writeText(JSON.stringify(manifest, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    if (!manifest) return;
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${manifest.projectName.toLowerCase().replace(/\s+/g, '-')}-unification-manifest.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-800/40 rounded-xl p-6 border border-purple-500/20 space-y-6" id="unifier-tool-root">
      {/* Tool Header */}
      <div className="flex flex-wrap justify-between items-start gap-4 border-b border-slate-700 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded text-xs uppercase font-mono font-bold tracking-wider">
              UniSpec Tool
            </span>
            <h3 className="text-xl font-bold flex items-center gap-2 text-slate-100">
              <GitMerge className="w-5 h-5 text-purple-400" />
              Unified Portfolio Integrator (The Unifier)
            </h3>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Grades, resolves, and maps multi-variant codebases into a single consolidated implementation blueprint.
          </p>
        </div>
      </div>

      {/* Mode Selector and Setup */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column: Setup Config */}
        <div className="lg:col-span-1 bg-slate-900/60 p-5 rounded-xl border border-slate-800 space-y-4">
          <h4 className="text-sm font-semibold uppercase text-slate-300 tracking-wider flex items-center gap-2">
            <Box className="w-4 h-4 text-purple-400" />
            1. Configure Standalone Isolation
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Select high-reusability components from the registry that you explicitly wish to decouple as independent shared packages instead of merging.
          </p>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 divide-y divide-slate-800/60 scrollbar-thin scrollbar-thumb-purple-500/10">
            {artifacts.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No registry artifacts discovered yet.</p>
            ) : (
              artifacts.map(art => (
                <label 
                  key={art.id} 
                  className="flex items-start gap-3 py-2 cursor-pointer group"
                >
                  <input 
                    type="checkbox"
                    checked={selectedExtractions.includes(art.id)}
                    onChange={() => toggleExtraction(art.id)}
                    className="mt-1 rounded text-purple-600 bg-slate-950 border-slate-800 focus:ring-purple-500 focus:ring-offset-slate-900"
                  />
                  <div className="text-left">
                    <span className="text-xs font-semibold text-slate-300 group-hover:text-purple-400 transition-colors">
                      {art.name}
                    </span>
                    <span className="block text-[10px] text-slate-500 font-mono capitalize">
                      {art.type} &bull; {art.metrics.maturity}
                    </span>
                  </div>
                </label>
              ))
            )}
          </div>

          <div className="border-t border-slate-800 pt-4">
            <button
              onClick={handleRunUnifier}
              disabled={loading || artifacts.length === 0}
              className={`w-full py-2.5 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                loading || artifacts.length === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-purple-600 text-white hover:bg-purple-700 active:scale-[0.98] border border-purple-500'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-purple-300" />
                  <span>{loadingMessage}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-purple-300" />
                  <span>Compile Unifier Manifest</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Columns: Manifest Outputs */}
        <div className="lg:col-span-2 flex flex-col min-h-[350px] bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden">
          {/* Output Header / Tabs */}
          <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex flex-wrap justify-between items-center gap-4">
            <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
              <button
                onClick={() => setActiveTab('decisions')}
                disabled={!manifest}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  !manifest ? 'text-slate-600 cursor-not-allowed' :
                  activeTab === 'decisions' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Resolution Decisions
              </button>
              <button
                onClick={() => setActiveTab('standalone')}
                disabled={!manifest}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  !manifest ? 'text-slate-600 cursor-not-allowed' :
                  activeTab === 'standalone' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Standalone Isolated ({manifest?.extractedStandaloneModules?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('warnings')}
                disabled={!manifest}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  !manifest ? 'text-slate-600 cursor-not-allowed' :
                  activeTab === 'warnings' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Warnings ({manifest?.warnings?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('json')}
                disabled={!manifest}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  !manifest ? 'text-slate-600 cursor-not-allowed' :
                  activeTab === 'json' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Raw Manifest JSON
              </button>
            </div>

            {manifest && (
              <div className="flex gap-2">
                <button
                  onClick={handleCopyJson}
                  className="p-1.5 rounded bg-slate-950 border border-slate-800 hover:border-slate-600 text-slate-300 transition-all active:scale-95"
                  title="Copy Blueprint JSON"
                >
                  {isCopied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleDownloadJson}
                  className="p-1.5 rounded bg-slate-950 border border-slate-800 hover:border-slate-600 text-slate-300 transition-all active:scale-95"
                  title="Download Manifest"
                >
                  <Download className="w-4 h-4 text-purple-400" />
                </button>
              </div>
            )}
          </div>

          {/* Tab Contents */}
          <div className="p-6 flex-1 overflow-y-auto max-h-[400px]">
            {!manifest ? (
              <div className="h-full flex flex-col justify-center items-center text-center p-8 space-y-3">
                <GitMerge className="w-10 h-10 text-slate-600 animate-pulse" />
                <div>
                  <h5 className="font-bold text-slate-300">Generate Blueprint Manifest</h5>
                  <p className="text-xs text-slate-500 max-w-sm mt-1 mx-auto leading-relaxed">
                    Select standalone extractions on the left if desired, and click "Compile Unifier Manifest" to invoke the Principal Architect resolution matrix.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {activeTab === 'decisions' && (
                  <div className="space-y-4 text-left">
                    <div className="bg-purple-500/5 p-3 rounded-lg border border-purple-500/10 text-xs text-purple-300 flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Target Unified Architecture Model:</strong>
                        <span className="block text-slate-300 font-semibold mt-0.5">{manifest.targetArchitecture}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {manifest.decisions.map((decision, index) => {
                        const artifact = artifacts.find(a => a.id === decision.winningArtifactId);
                        return (
                          <div key={index} className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 space-y-3">
                            <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-800 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono text-[10px] px-1.5 py-0.5 rounded">
                                  Concept #{index + 1}
                                </span>
                                <h5 className="font-bold text-sm text-slate-200">
                                  {artifact ? artifact.name : decision.winningArtifactId}
                                </h5>
                              </div>
                              <span className="text-[11px] text-slate-400">
                                Winner Source: <strong className="text-purple-300">{decision.winningRepositoryId}</strong>
                              </span>
                            </div>

                            <p className="text-xs text-slate-300 leading-relaxed">
                              <strong>Resolution Decision:</strong> {decision.reasoning}
                            </p>

                            {decision.requiredIntegrations.length > 0 && (
                              <div className="space-y-1">
                                <span className="text-[10px] uppercase tracking-wider font-semibold text-purple-400 block">Required Bridge Adaptations</span>
                                <ul className="list-disc pl-4 text-xs text-slate-400 space-y-0.5">
                                  {decision.requiredIntegrations.map((integration, idx) => (
                                    <li key={idx}>{integration}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {decision.discardedArtifactIds.length > 0 && (
                              <p className="text-[10px] text-slate-500 font-medium bg-slate-950 p-2 rounded border border-slate-900/60">
                                <strong>Superseded Candidates:</strong> {decision.discardedArtifactIds.join(', ')} (marked for safe removal/deprecating)
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeTab === 'standalone' && (
                  <div className="space-y-3 text-left">
                    {manifest.extractedStandaloneModules.length === 0 ? (
                      <div className="text-center py-10 text-slate-500 text-xs">
                        No standalone packages were isolated. All components are cataloged for inline unification.
                      </div>
                    ) : (
                      manifest.extractedStandaloneModules.map((mod, idx) => (
                        <div key={idx} className="bg-slate-900 p-4 rounded-lg border border-slate-800 flex items-center justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="text-xs font-bold text-slate-200">{mod.artifactId}</span>
                              <p className="text-xs text-slate-400 mt-1 italic">"{mod.reason}"</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleExportBundle(mod)}
                            disabled={extractingBundleId !== null}
                            className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600 border border-purple-500/20 hover:border-purple-500 text-purple-300 hover:text-white rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 disabled:opacity-40 flex-shrink-0"
                          >
                            {extractingBundleId === mod.artifactId ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Exporting...</span>
                              </>
                            ) : (
                              <>
                                <Download className="w-3.5 h-3.5" />
                                <span>Export Package</span>
                              </>
                            )}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'warnings' && (
                  <div className="space-y-3 text-left">
                    {manifest.warnings.length === 0 ? (
                      <div className="bg-emerald-500/10 p-4 rounded-lg border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        <span>High Ecosystem Fit! No tech-stack discrepancies or conflicting frameworks were flagged.</span>
                      </div>
                    ) : (
                      manifest.warnings.map((warning, idx) => (
                        <div key={idx} className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3.5 flex items-start gap-3">
                          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-xs font-bold text-amber-400">Conflict Warning</span>
                            <p className="text-xs text-slate-300 mt-1 leading-relaxed">{warning}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'json' && (
                  <div className="relative text-left font-mono text-xs text-slate-300 bg-slate-900 rounded-lg p-4 border border-slate-800 overflow-x-auto select-all max-h-[350px]">
                    <pre className="whitespace-pre-wrap">{JSON.stringify(manifest, null, 2)}</pre>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifierToolDisplay;
