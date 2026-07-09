import React, { useState } from 'react';
import { type KnowledgeArtifact, type EvolutionReport } from '../knowledge/types';
import { Check, Sparkles, FileText, Box, Zap, ChevronRight } from './Icons';

interface KnowledgeRegistryDisplayProps {
  artifacts: KnowledgeArtifact[];
  evolutionReports?: EvolutionReport[];
}

const KnowledgeRegistryDisplay: React.FC<KnowledgeRegistryDisplayProps> = ({ artifacts, evolutionReports = [] }) => {
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'artifacts' | 'evolution'>('artifacts');
  const [filterType, setFilterType] = useState<string>('all');

  const selectedArtifact = artifacts.find(a => a.id === selectedArtifactId);

  const types = ["all", "product", "capability", "component", "service", "integration", "pattern", "decision", "experiment"];

  const filteredArtifacts = filterType === 'all' 
    ? artifacts 
    : artifacts.filter(a => a.type === filterType);

  const getMaturityColor = (maturity: string) => {
    switch (maturity) {
      case 'production': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'prototype': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      default: return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
    }
  };

  const getPotentialColor = (potential: string) => {
    switch (potential) {
      case 'high': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'medium': return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
      default: return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    }
  };

  const productionCount = artifacts.filter(a => a.metrics.maturity === 'production').length;
  const prototypeCount = artifacts.filter(a => a.metrics.maturity === 'prototype').length;
  const experimentalCount = artifacts.filter(a => a.metrics.maturity === 'experimental').length;

  return (
    <div className="bg-slate-800/40 rounded-xl p-6 border border-purple-500/20 space-y-6" id="knowledge-registry-root">
      <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-700 pb-4">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Box className="w-5 h-5 text-purple-400" />
            Knowledge Artifact Registry
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Strictly promoted engineering objects discovered across variant codebases.
          </p>
        </div>
        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
          <button
            onClick={() => setActiveTab('artifacts')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === 'artifacts' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Discovered Artifacts ({artifacts.length})
          </button>
          <button
            onClick={() => setActiveTab('evolution')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === 'evolution' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Evolution Timeline ({evolutionReports.length})
          </button>
        </div>
      </div>

      {activeTab === 'artifacts' ? (
        <div className="space-y-6">
          {/* Metrics summary widgets */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Registry Size</span>
              <p className="text-2xl font-bold text-white mt-1">{artifacts.length}</p>
              <span className="text-[10px] text-purple-400 block mt-1">Promoted components</span>
            </div>
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Production Spec</span>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{productionCount}</p>
              <span className="text-[10px] text-slate-500 block mt-1">Fully production ready</span>
            </div>
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Prototypes</span>
              <p className="text-2xl font-bold text-amber-400 mt-1">{prototypeCount}</p>
              <span className="text-[10px] text-slate-500 block mt-1">Verified local states</span>
            </div>
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Experimental Labs</span>
              <p className="text-2xl font-bold text-purple-400 mt-1">{experimentalCount}</p>
              <span className="text-[10px] text-slate-500 block mt-1">Low-confidence variants</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 mr-2">Filter Type:</span>
            {types.map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1 rounded-full text-xs font-medium border capitalize transition-all ${
                  filterType === t 
                    ? 'bg-purple-600/20 text-purple-300 border-purple-500/50' 
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Artifact List */}
            <div className="lg:col-span-1 bg-slate-900/40 border border-slate-800 rounded-xl max-h-[500px] overflow-y-auto divide-y divide-slate-800/60 scrollbar-thin scrollbar-thumb-purple-500/10">
              {filteredArtifacts.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">
                  No artifacts match this category filter.
                </div>
              ) : (
                filteredArtifacts.map(artifact => (
                  <button
                    key={artifact.id}
                    onClick={() => setSelectedArtifactId(artifact.id)}
                    className={`w-full text-left p-4 hover:bg-slate-800/40 transition-all flex flex-col gap-1 ${
                      selectedArtifactId === artifact.id ? 'bg-purple-600/10 border-l-2 border-purple-500' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-bold text-slate-200 text-sm">{artifact.name}</span>
                      <span className="text-[10px] font-mono uppercase bg-slate-800 text-purple-300 px-2 py-0.5 rounded border border-purple-500/10">
                        {artifact.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1">{artifact.purpose}</p>
                    <div className="flex gap-2 mt-1 items-center text-[10px]">
                      <span className={`px-1.5 py-0.5 rounded border ${getMaturityColor(artifact.metrics.maturity)}`}>
                        {artifact.metrics.maturity}
                      </span>
                      <span className="text-slate-500">Confidence: {(artifact.metrics.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Artifact Detail Panel */}
            <div className="lg:col-span-2 bg-slate-950/60 border border-slate-800 rounded-xl p-6 min-h-[300px] flex flex-col justify-between">
              {selectedArtifact ? (
                <div className="space-y-6">
                  <div className="flex flex-wrap justify-between items-start gap-4 border-b border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-lg font-bold text-slate-100">{selectedArtifact.name}</h4>
                        <span className="text-xs font-mono uppercase bg-purple-600/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded">
                          {selectedArtifact.type}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 italic mt-1 font-medium">"{selectedArtifact.purpose}"</p>
                    </div>
                    <div className="flex flex-col gap-1 text-right text-xs">
                      <span className="text-slate-500 text-[10px]">Registry ID: {selectedArtifact.id}</span>
                      <span className="text-slate-500 text-[10px]">Last Synced: {new Date(selectedArtifact.metrics.lastUpdated).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 flex flex-col justify-between">
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">Maturity Level</span>
                      <span className={`text-xs font-bold px-2 py-0.5 mt-2 rounded border inline-block text-center capitalize ${getMaturityColor(selectedArtifact.metrics.maturity)}`}>
                        {selectedArtifact.metrics.maturity}
                      </span>
                    </div>
                    <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 flex flex-col justify-between">
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">Reuse Potential</span>
                      <span className={`text-xs font-bold px-2 py-0.5 mt-2 rounded border inline-block text-center capitalize ${getPotentialColor(selectedArtifact.metrics.reusePotential)}`}>
                        {selectedArtifact.metrics.reusePotential}
                      </span>
                    </div>
                    <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 flex flex-col justify-between">
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">Alignment Match</span>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 bg-slate-850 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-purple-500 h-full rounded-full" 
                            style={{ width: `${selectedArtifact.metrics.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-300">{(selectedArtifact.metrics.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h5 className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Comprehensive Architecture Spec</h5>
                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{selectedArtifact.description}</p>
                  </div>

                  {selectedArtifact.implementations && selectedArtifact.implementations.length > 0 && (
                    <div className="space-y-3">
                      <h5 className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Discovered Implementations</h5>
                      <div className="space-y-2">
                        {selectedArtifact.implementations.map((impl, index) => (
                          <div key={index} className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-1">
                            <div className="flex justify-between text-slate-400 text-[10px] border-b border-slate-800 pb-1 mb-1">
                              <span>Source: <strong className="text-slate-300">{impl.repositoryId}</strong></span>
                              <span className="uppercase text-purple-400 font-mono font-semibold">{impl.language}</span>
                            </div>
                            <div>
                              <strong>Paths:</strong>
                              <ul className="list-disc pl-4 mt-1 space-y-0.5 font-mono text-[10px] text-slate-400">
                                {impl.filePaths.map((p, pi) => <li key={pi}>{p}</li>)}
                              </ul>
                            </div>
                            {impl.notes && (
                              <p className="text-slate-400 text-[11px] mt-1 bg-slate-950 p-1.5 rounded border border-slate-800 italic">
                                "{impl.notes}"
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedArtifact.relationships && selectedArtifact.relationships.length > 0 && (
                    <div className="space-y-3">
                      <h5 className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Semantic Registry Relationships</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {selectedArtifact.relationships.map((rel, index) => (
                          <div key={index} className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-xs flex gap-2 items-start">
                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase mt-0.5 ${
                              rel.type === 'conflicts_with' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                            }`}>
                              {rel.type.replace('_', ' ')}
                            </span>
                            <div>
                              <span className="font-bold text-slate-300 block">{rel.targetArtifactId}</span>
                              <p className="text-slate-500 text-[10px] mt-0.5">{rel.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-[10px] text-slate-500 bg-slate-900/40 p-2 rounded border border-slate-800/40 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Discovered in <strong>{selectedArtifact.discoveredFrom.join(', ')}</strong> under strictpromotion filters.</span>
                  </div>
                </div>
              ) : (
                <div className="m-auto text-center py-12 space-y-3">
                  <Zap className="w-8 h-8 text-slate-600 mx-auto animate-pulse" />
                  <p className="text-slate-500 text-sm">Select an artifact from the registry to view its complete properties, quality metrics, relationships, and code locations.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-3 bg-purple-500/10 p-4 rounded-xl border border-purple-500/20 text-xs text-purple-300">
            <FileText className="w-5 h-5 text-purple-400" />
            <p><strong>Maturity Drift Log:</strong> This log captures how components transitioned from basic experiments and prototypes into high-confidence enterprise spec boundaries across your codebase variants.</p>
          </div>

          {evolutionReports.length === 0 ? (
            <div className="p-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
              No maturity state transitions or version modifications have been recorded in this registry sync.
            </div>
          ) : (
            <div className="relative border-l border-slate-700 ml-4 pl-6 space-y-6">
              {evolutionReports.map((report, idx) => (
                <div key={idx} className="relative">
                  {/* Timeline point */}
                  <div className="absolute -left-[31px] bg-slate-900 w-4 h-4 rounded-full border border-purple-500 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                  </div>

                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-purple-400">{new Date(report.timestamp).toLocaleString()}</span>
                        <span className="text-xs font-semibold text-slate-300">Maturity Shift</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span className={`px-1.5 py-0.5 rounded border capitalize ${getMaturityColor(report.previousMaturity)}`}>
                          {report.previousMaturity}
                        </span>
                        <ChevronRight className="w-3 h-3 text-slate-600" />
                        <span className={`px-1.5 py-0.5 rounded border capitalize ${getMaturityColor(report.newMaturity)}`}>
                          {report.newMaturity}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-200"><strong>Transition Context:</strong> {report.transitionReason}</p>
                    {report.notes && (
                      <p className="text-xs text-slate-400 bg-slate-950 p-2 rounded border border-slate-850 italic">
                        "{report.notes}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default KnowledgeRegistryDisplay;
