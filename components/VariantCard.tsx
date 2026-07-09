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
    <div className="bg-white/80 rounded-2xl p-5 border border-slate-200/50 hover:border-blue-200/50 transition-all group">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 group-hover:text-blue-500 group-hover:bg-blue-50 transition-all">
              <FileCode className="w-5 h-5 flex-shrink-0" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 break-all">{variant.name}</h4>
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
                {variant.sourceType} • {variant.fileName || variant.repo || 'Source'}
              </p>
            </div>
            {isAnalysisComplete && (
              <span className="ml-2 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider rounded-md">
                Verified
              </span>
            )}
            {variant.hasCCC && (
              <span className="ml-2 px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-bold uppercase tracking-wider rounded-md" title="Pre-compiled Code Context Compiler (CCC) artifacts detected!">
                CCC ✓
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2 self-end sm:self-center">
          <button onClick={onView} className="w-10 h-10 flex items-center justify-center soft-button rounded-xl text-slate-600 hover:text-blue-600" title="View details">
            <Eye className="w-4 h-4" />
          </button>
          {!isAnalysisComplete && (
            <button 
              onClick={onExtract} 
              disabled={loading || isAnalysisInProgress || isAgentRunning} 
              className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black transition-all"
            >
              {isAnalysisInProgress ? 'Processing...' : 'Decompose'}
            </button>
          )}
          <button onClick={onDelete} className="w-10 h-10 flex items-center justify-center bg-rose-50 hover:bg-rose-100 rounded-xl transition-all" title="Delete">
            <Trash2 className="w-4 h-4 text-rose-500" />
          </button>
        </div>
      </div>
      {variant.extractionProgress > 0 && (
          <div className="mt-4">
              <AnalysisProgress progress={variant.extractionProgress} totalSteps={variant.totalExtractionSteps} />
          </div>
      )}
      {variant.tokenEstimate !== undefined && (
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
          <span className="font-semibold text-slate-700">Estimated Workspace Context:</span>
          <span>{variant.tokenEstimate.toLocaleString()} tokens</span>
          {variant.truncated ? (
            <span className="ml-auto bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
              Truncated
            </span>
          ) : (
            <span className="ml-auto bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
              Within Budget
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default VariantCard;