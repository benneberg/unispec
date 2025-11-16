import React from 'react';
import { type Variant } from '../types';
import { FileCode, Eye, Trash2 } from './Icons';
import AnalysisProgress from './AnalysisProgress';

interface VariantCardProps {
  variant: Variant;
  onDelete: () => void;
  onExtract: () => void;
  onView: () => void;
  isAgentRunning: boolean;
  loading: boolean;
}

const VariantCard: React.FC<VariantCardProps> = ({ variant, onDelete, onExtract, onView, isAgentRunning, loading }) => {
  const isAnalysisComplete = variant.extractionProgress === variant.totalExtractionSteps;
  const isAnalysisInProgress = variant.extractionProgress > 0 && variant.extractionProgress < variant.totalExtractionSteps;

  return (
    <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <FileCode className="w-5 h-5 text-purple-400 flex-shrink-0" />
            <h4 className="font-bold text-lg break-all">{variant.name}</h4>
            {isAnalysisComplete && (
              <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full whitespace-nowrap">
                Analyzed
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 capitalize">
            Source: {variant.sourceType}
            {variant.fileName && ` • File: ${variant.fileName}`}
            {variant.repoUrl && ` • Repo: ${variant.repo}`}
          </p>
        </div>
        <div className="flex gap-2 self-end sm:self-center">
          <button onClick={onView} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg" title="View details">
            <Eye className="w-4 h-4" />
          </button>
          {!isAnalysisComplete && (
            <button 
              onClick={onExtract} 
              disabled={loading || isAnalysisInProgress || isAgentRunning} 
              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalysisInProgress ? 'Analyzing...' : 'Run Analysis'}
            </button>
          )}
          <button onClick={onDelete} className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg" title="Delete">
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>
      {variant.extractionProgress > 0 && (
          <div className="mt-4">
              <AnalysisProgress progress={variant.extractionProgress} totalSteps={variant.totalExtractionSteps} />
          </div>
      )}
    </div>
  );
};

export default VariantCard;