import React from 'react';
import { type NormalizationResult } from '../types';
import { Loader2 } from './Icons';

interface ConflictReportProps {
  result: NormalizationResult;
  onConsolidate: () => void;
  loading: boolean;
  isAgentRunning: boolean;
  isConsolidationDone: boolean;
}

const ConflictReport: React.FC<ConflictReportProps> = ({ result, onConsolidate, loading, isAgentRunning, isConsolidationDone }) => {
  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-purple-500/20 space-y-6">
      <div>
        <h3 className="text-xl font-bold">Conflict & Normalization Report</h3>
        <p className="text-purple-300 mt-1">AI-detected conflicts and a proposed harmonized model for consolidation.</p>
      </div>

      <div className="space-y-4">
        <h4 className="text-lg font-bold text-purple-400 mb-2">Detected Conflicts</h4>
        {result.conflicts?.length > 0 ? (
          <div className="space-y-3">
            {result.conflicts.map((conflict, index) => (
              <div key={index} className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-2">
                    <span className="font-bold text-base">{conflict.area}</span>
                    <span className="text-xs bg-slate-700 px-2 py-1 rounded-full">{conflict.variantsInvolved.join(', ')}</span>
                </div>
                <p className="text-slate-300 mb-2">{conflict.description}</p>
                <div className="bg-purple-500/10 p-3 rounded">
                    <p className="font-semibold text-sm text-purple-300 mb-1">Recommendation:</p>
                    <p className="text-sm text-purple-200">{conflict.recommendation}</p>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-slate-400">No major conflicts detected.</p>}
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
            <h4 className="text-lg font-bold text-purple-400 mb-2">Harmonized Domain Model</h4>
            <pre className="bg-slate-900 p-4 rounded-lg text-sm overflow-auto max-h-96 whitespace-pre-wrap">{result.harmonizedDomainModel}</pre>
        </div>
         <div>
            <h4 className="text-lg font-bold text-purple-400 mb-2">Normalized Modules</h4>
            <pre className="bg-slate-900 p-4 rounded-lg text-sm overflow-auto max-h-96 whitespace-pre-wrap">{result.normalizedModules}</pre>
        </div>
      </div>
       <div>
            <h4 className="text-lg font-bold text-purple-400 mb-2">Architect's Notes</h4>
            <pre className="bg-slate-900 p-4 rounded-lg text-sm overflow-auto max-h-96 whitespace-pre-wrap">{result.notes}</pre>
        </div>

      {!isAgentRunning && !isConsolidationDone && (
        <div className="bg-slate-900/50 rounded-xl p-6 border border-purple-500/20 text-center mt-6">
            <h3 className="text-xl font-bold mb-4">Ready to Consolidate?</h3>
            <p className="text-purple-300 mb-4">Generate the final master documentation based on this harmonized model.</p>
            <button
                onClick={onConsolidate}
                disabled={loading}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium disabled:opacity-50 flex items-center gap-2 mx-auto"
            >
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                Generate Consolidated Specs
            </button>
        </div>
        )}

    </div>
  );
};

export default ConflictReport;
