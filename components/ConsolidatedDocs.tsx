import React from 'react';
import { Download } from './Icons';
import { type ConsolidatedDocs } from '../types';

interface ConsolidatedDocsDisplayProps {
  docs: ConsolidatedDocs;
  onExport: () => void;
}

const ConsolidatedDocsDisplay: React.FC<ConsolidatedDocsDisplayProps> = ({ docs, onExport }) => {
  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-purple-500/20 space-y-4">
       <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
            <h3 className="text-xl font-bold">Consolidated Documentation</h3>
            <button
                onClick={onExport}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2"
            >
                <Download className="w-4 h-4" />
                Export All Docs
            </button>
        </div>
      
        <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(docs).map(([key, value]) => {
                if (!value) return null;
                return (
                    <div key={key} className="bg-slate-900 p-4 rounded-lg">
                        <h4 className="font-bold text-purple-400 mb-2 capitalize">{key.replace(/([A-Z])/g, ' $1')}</h4>
                        <pre className="text-xs overflow-auto max-h-40 text-slate-300 whitespace-pre-wrap">
                        {String(value).substring(0, 500)}...
                        </pre>
                    </div>
                )
            })}
        </div>
    </div>
  );
};

export default ConsolidatedDocsDisplay;
