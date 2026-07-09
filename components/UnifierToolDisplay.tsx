import React, { useState } from 'react';
import { type KnowledgeArtifact } from '../knowledge/types';
import { type UnificationManifest } from '../tools/unifier/types';
import { type ApiConfig } from '../types';
import { useWorkspace } from '../contexts/WorkspaceContext';
import JSZip from 'jszip';
import { 
  GitMerge, Sparkles, Loader2, Info, AlertTriangle, 
  CheckCircle, Copy, Download, Box
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
    <div className="bg-white border-2 border-black rounded-none p-6 md:p-8 space-y-6 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]" id="unifier-tool-root">
      {/* Tool Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-black pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-black text-white px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wider">
              UNISPEC_CORE.UNIFIER
            </span>
            <h3 className="text-lg font-bold font-display uppercase tracking-tight text-black flex items-center gap-2">
              <GitMerge className="w-5 h-5 text-[#FF5500]" />
              Unified Portfolio Integrator
            </h3>
          </div>
          <p className="text-xs text-neutral-500 mt-1 uppercase font-mono">
            [MODE = AUTO_CONSOLIDATE_BLUEPRINT]
          </p>
        </div>
      </div>

      {/* Mode Selector and Setup */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column: Setup Config */}
        <div className="lg:col-span-1 bg-neutral-50 border-2 border-black p-5 rounded-none space-y-4">
          <h4 className="text-xs font-mono font-bold uppercase text-black tracking-wider flex items-center gap-2">
            <Box className="w-4 h-4 text-black" />
            1. Configure Isolation
          </h4>
          <p className="text-xs text-neutral-600 leading-relaxed font-sans">
            Select high-reusability components from the registry to decouple as independent shared packages instead of merging.
          </p>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 divide-y divide-neutral-200">
            {artifacts.length === 0 ? (
              <p className="text-xs text-neutral-400 py-4 text-center font-mono italic">// no registry artifacts discovered</p>
            ) : (
              artifacts.map(art => (
                <label 
                  key={art.id} 
                  className="flex items-start gap-3 py-2.5 cursor-pointer group select-none"
                >
                  <input 
                    type="checkbox"
                    checked={selectedExtractions.includes(art.id)}
                    onChange={() => toggleExtraction(art.id)}
                    className="mt-1 h-4 w-4 accent-black border-2 border-black rounded-none cursor-pointer"
                  />
                  <div className="text-left font-mono">
                    <span className="text-xs font-bold text-black group-hover:text-[#FF5500] transition-colors">
                      {art.name}
                    </span>
                    <span className="block text-[10px] text-neutral-400 uppercase font-semibold mt-0.5">
                      {art.type} // {art.metrics.maturity}
                    </span>
                  </div>
                </label>
              ))
            )}
          </div>

          <div className="border-t border-black pt-4">
            <button
              onClick={handleRunUnifier}
              disabled={loading || artifacts.length === 0}
              className="w-full py-3 bg-black text-white hover:bg-neutral-900 border-2 border-black rounded-none text-xs font-mono font-bold uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all hover:shadow-[3px_3px_0px_0px_#FF5500]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>{loadingMessage}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>Compile Manifest</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Columns: Manifest Outputs */}
        <div className="lg:col-span-2 flex flex-col min-h-[350px] bg-white border-2 border-black rounded-none overflow-hidden">
          {/* Output Header / Tabs */}
          <div className="bg-neutral-50 px-4 py-2 border-b-2 border-black flex flex-wrap justify-between items-center gap-4">
            <div className="flex border border-neutral-300 p-0.5 bg-white">
              <button
                onClick={() => setActiveTab('decisions')}
                disabled={!manifest}
                className={`px-3 py-1.5 text-[11px] font-mono font-bold uppercase tracking-wider transition-all ${
                  !manifest ? 'text-neutral-300 cursor-not-allowed' :
                  activeTab === 'decisions' ? 'bg-black text-white' : 'text-neutral-500 hover:text-black'
                }`}
              >
                Decisions
              </button>
              <button
                onClick={() => setActiveTab('standalone')}
                disabled={!manifest}
                className={`px-3 py-1.5 text-[11px] font-mono font-bold uppercase tracking-wider transition-all ${
                  !manifest ? 'text-neutral-300 cursor-not-allowed' :
                  activeTab === 'standalone' ? 'bg-black text-white' : 'text-neutral-500 hover:text-black'
                }`}
              >
                Isolated ({manifest?.extractedStandaloneModules?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('warnings')}
                disabled={!manifest}
                className={`px-3 py-1.5 text-[11px] font-mono font-bold uppercase tracking-wider transition-all ${
                  !manifest ? 'text-neutral-300 cursor-not-allowed' :
                  activeTab === 'warnings' ? 'bg-black text-white' : 'text-neutral-500 hover:text-black'
                }`}
              >
                Alerts ({manifest?.warnings?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('json')}
                disabled={!manifest}
                className={`px-3 py-1.5 text-[11px] font-mono font-bold uppercase tracking-wider transition-all ${
                  !manifest ? 'text-neutral-300 cursor-not-allowed' :
                  activeTab === 'json' ? 'bg-black text-white' : 'text-neutral-500 hover:text-black'
                }`}
              >
                JSON
              </button>
            </div>

            {manifest && (
              <div className="flex gap-2">
                <button
                  onClick={handleCopyJson}
                  className="p-1.5 border border-black bg-white text-black hover:bg-black hover:text-white transition-all text-xs font-mono"
                  title="Copy Blueprint JSON"
                >
                  {isCopied ? 'COPIED' : 'COPY'}
                </button>
                <button
                  onClick={handleDownloadJson}
                  className="p-1.5 border border-black bg-white text-black hover:bg-black hover:text-white transition-all"
                  title="Download Manifest"
                >
                  <Download className="w-4 h-4 text-black" />
                </button>
              </div>
            )}
          </div>

          {/* Tab Contents */}
          <div className="p-6 flex-1 overflow-y-auto max-h-[400px]">
            {!manifest ? (
              <div className="h-full flex flex-col justify-center items-center text-center p-8 space-y-3">
                <GitMerge className="w-8 h-8 text-neutral-400 animate-pulse" />
                <div>
                  <h5 className="font-mono text-xs font-bold uppercase tracking-wider text-black">Generate Blueprint Manifest</h5>
                  <p className="text-xs text-neutral-500 max-w-sm mt-1 mx-auto leading-relaxed font-sans">
                    Configure modular exceptions on the left as required, then invoke the Principal Architect engine pass.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {activeTab === 'decisions' && (
                  <div className="space-y-4 text-left">
                    <div className="border border-black bg-neutral-50 p-3.5 text-[11px] font-mono text-black flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-black flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>TARGET ARCHITECTURE COMPLIANCE:</strong>
                        <span className="block text-[#FF5500] font-bold mt-1 uppercase">{manifest.targetArchitecture}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {manifest.decisions.map((decision, index) => {
                        const artifact = artifacts.find(a => a.id === decision.winningArtifactId);
                        return (
                          <div key={index} className="border-2 border-black bg-white p-4 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="border border-black bg-black text-white font-mono text-[9px] px-1.5 py-0.5">
                                  COMP_{index + 1}
                                </span>
                                <h5 className="font-bold text-sm text-black uppercase">
                                  {artifact ? artifact.name : decision.winningArtifactId}
                                </h5>
                              </div>
                              <span className="text-[10px] font-mono text-neutral-500 uppercase">
                                Source: <strong className="text-black font-bold">{decision.winningRepositoryId}</strong>
                              </span>
                            </div>

                            <p className="text-xs text-neutral-700 leading-relaxed font-sans">
                              <strong className="font-mono text-[11px] text-black uppercase block mb-1">Resolution Protocol:</strong> {decision.reasoning}
                            </p>

                            {decision.requiredIntegrations.length > 0 && (
                              <div className="space-y-1 font-mono text-[11px]">
                                <span className="text-[10px] uppercase tracking-wider font-bold text-[#FF5500] block">Required Adapter Contracts:</span>
                                <ul className="list-disc pl-4 text-neutral-600 space-y-0.5">
                                  {decision.requiredIntegrations.map((integration, idx) => (
                                    <li key={idx}>{integration}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {decision.discardedArtifactIds.length > 0 && (
                              <p className="text-[10px] font-mono text-neutral-500 bg-neutral-50 p-2.5 border border-dashed border-neutral-300">
                                <strong>Decommissioned Candidates:</strong> {decision.discardedArtifactIds.join(', ')}
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
                      <div className="text-center py-10 font-mono text-neutral-400 text-xs">
                        // No isolated modules. All services unified inline.
                      </div>
                    ) : (
                      manifest.extractedStandaloneModules.map((mod, idx) => (
                        <div key={idx} className="bg-white border-2 border-black p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <CheckCircle className="w-4 h-4 text-black mt-0.5 flex-shrink-0" />
                            <div className="font-mono">
                              <span className="text-xs font-bold text-black">{mod.artifactId}</span>
                              <p className="text-[11px] text-neutral-500 mt-1 italic">"{mod.reason}"</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleExportBundle(mod)}
                            disabled={extractingBundleId !== null}
                            className="px-4 py-2 bg-black hover:bg-neutral-900 text-white border-2 border-black rounded-none font-mono text-xs uppercase tracking-wider font-bold transition-all disabled:opacity-40 flex-shrink-0"
                          >
                            {extractingBundleId === mod.artifactId ? (
                              <div className="flex items-center gap-1.5">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Exporting...</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <Download className="w-3.5 h-3.5" />
                                <span>Export</span>
                              </div>
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
                      <div className="border border-black bg-[#FAF9F5] p-4 text-xs font-mono text-black flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-black" />
                        <span>High Ecosystem Fit! No tech-stack discrepancies detected.</span>
                      </div>
                    ) : (
                      manifest.warnings.map((warning, idx) => (
                        <div key={idx} className="border-2 border-red-600 bg-red-50 p-4 flex items-start gap-3 rounded-none">
                          <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <div className="font-mono">
                            <span className="text-[11px] font-bold text-red-700 uppercase">Architecture Clashing Alert</span>
                            <p className="text-xs text-red-950 mt-1 leading-relaxed font-sans">{warning}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'json' && (
                  <div className="relative text-left font-mono text-xs text-black bg-neutral-50 border border-black p-4 select-all max-h-[350px] overflow-x-auto">
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
