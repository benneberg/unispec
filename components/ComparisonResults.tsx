import React from 'react';
import { Loader2 } from './Icons';

interface ComparisonResultsProps {
  onCompare: () => void;
  loading: boolean;
}

const ComparisonResults: React.FC<ComparisonResultsProps> = ({ onCompare, loading }) => {
  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-purple-500/20">
      <h3 className="text-xl font-bold mb-4">Compare & Normalize Variants</h3>
      <p className="text-purple-300 mb-4">
        Run a deep analysis to compare variants, detect conflicts, and generate a harmonized model for consolidation.
      </p>
      <button
        onClick={onCompare}
        disabled={loading}
        className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium disabled:opacity-50 flex items-center gap-2"
      >
        {loading && <Loader2 className="w-5 h-5 animate-spin" />}
        Run Comparison & Normalization
      </button>
    </div>
  );
};

export default ComparisonResults;
