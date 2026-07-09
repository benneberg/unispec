
import React from 'react';
import Markdown from 'react-markdown';
import { Download, Loader2, MessageSquare, ShieldCheck } from './Icons';
import { type ConsolidatedDocs } from '../types';
import ArchitectureDiagrams from './ArchitectureDiagrams';
import ImplementationBlueprint from './ImplementationBlueprint';
import ValidationReportDisplay from './ValidationReportDisplay';
import KnowledgeRegistryDisplay from './KnowledgeRegistryDisplay';
import UnifierToolDisplay from './UnifierToolDisplay';
import { useWorkspace } from '../contexts/WorkspaceContext';

interface ConsolidatedDocsDisplayProps {
  docs: ConsolidatedDocs;
  onShowExportModal: () => void;
  onGenerateVisuals: () => void;
  onRunValidation: () => void;
  onRunUnifier: (explicitExtractions: string[]) => Promise<void>;
  onAskArchitect: () => void;
  loading: boolean;
}

const ConsolidatedDocsDisplay: React.FC<ConsolidatedDocsDisplayProps> = ({ docs, onShowExportModal, onGenerateVisuals, onRunValidation, onRunUnifier, onAskArchitect, loading }) => {
  const { state } = useWorkspace();
  const { currentWorkspace } = state;
  const artifacts = currentWorkspace?.knowledgeArtifacts || [];
  const evolutionReports = currentWorkspace?.evolutionReports || [];

  const hasVisuals = !!docs.architectureDiagrams || !!docs.implementationBlueprint;
  const hasValidation = !!docs.validationReport;
  
  const textDocs = {
      prd: docs.prd,
      architecture: docs.architecture,
      modules: docs.modules,
      dataModel: docs.dataModel,
      decisions: docs.decisions,
      migration: docs.migration,
      consolidated: docs.consolidated
  };

  return (
    <div className="space-y-6">
        <div className="bg-slate-800/50 rounded-xl p-6 border border-purple-500/20 space-y-4">
           <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                <h3 className="text-xl font-bold">Consolidated Documentation</h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onAskArchitect}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2"
                        title="Ask a question about the project"
                    >
                        <MessageSquare className="w-4 h-4" />
                        Ask the Architect
                    </button>
                    <button
                        onClick={onShowExportModal}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Export...
                    </button>
                </div>
            </div>
          
            <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(textDocs).map(([key, value]) => {
                    if (!value) return null;
                    return (
                        <div key={key} className="bg-slate-900 p-4 rounded-lg flex flex-col">
                            <h4 className="font-bold text-purple-400 mb-2 capitalize">{key.replace(/([A-Z])/g, ' $1')}</h4>
                            <div className="text-xs overflow-auto max-h-60 text-slate-300 prose prose-invert prose-xs scrollbar-thin scrollbar-thumb-purple-500/20">
                                <Markdown>{String(value)}</Markdown>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>

        {artifacts.length > 0 && (
          <KnowledgeRegistryDisplay artifacts={artifacts} evolutionReports={evolutionReports} />
        )}

        {artifacts.length > 0 && (
          <UnifierToolDisplay 
            artifacts={artifacts} 
            manifest={currentWorkspace?.unificationManifest} 
            onGenerateManifest={onRunUnifier} 
            loading={loading} 
          />
        )}

        {hasVisuals ? (
          <div className="space-y-6">
            {docs.architectureDiagrams && <ArchitectureDiagrams diagrams={docs.architectureDiagrams} />}
            {docs.implementationBlueprint && <ImplementationBlueprint blueprint={docs.implementationBlueprint} />}
          </div>
        ) : (
            <div className="bg-slate-800/50 rounded-xl p-6 border border-purple-500/20 text-center">
                <h3 className="text-xl font-bold mb-4">Generate Visuals & Blueprint</h3>
                <p className="text-purple-300 mb-4">Create architecture diagrams and a code implementation blueprint from the consolidated docs.</p>
                <button
                    onClick={onGenerateVisuals}
                    disabled={loading}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium disabled:opacity-50 flex items-center gap-2 mx-auto"
                >
                    {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                    Generate Assets
                </button>
            </div>
        )}

        {hasValidation ? (
            <ValidationReportDisplay report={docs.validationReport!} />
        ) : (
            <div className="bg-slate-800/50 rounded-xl p-6 border border-purple-500/20 text-center">
                <h3 className="text-xl font-bold mb-4">Round-Trip Validation</h3>
                <p className="text-purple-300 mb-4">Check the final spec against the original variants to ensure no features were lost.</p>
                <button
                    onClick={onRunValidation}
                    disabled={loading}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium disabled:opacity-50 flex items-center gap-2 mx-auto"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                    Run Validation
                </button>
            </div>
        )}

    </div>
  );
};

export default ConsolidatedDocsDisplay;
