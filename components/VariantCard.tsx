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
    <div className="bg-white border-2 border-black rounded-none p-5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all group">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-9 h-9 flex items-center justify-center border border-black bg-neutral-50 text-black">
              <FileCode className="w-4 h-4 flex-shrink-0" />
            </div>
            <div>
              <h4 className="font-bold text-black break-all text-sm font-sans uppercase tracking-tight">
                {variant.name}
              </h4>
              <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider mt-0.5">
                {variant.sourceType} // {variant.fileName || variant.repo || 'source'}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 ml-auto sm:ml-0">
              {isAnalysisComplete && (
                <span className="px-2 py-0.5 border border-black bg-black text-white text-[9px] font-mono font-bold uppercase tracking-wider">
                  Verified
                </span>
              )}
              {variant.hasCCC && (
                <span className="px-2 py-0.5 border border-black bg-[#FF5500] text-white text-[9px] font-mono font-bold uppercase tracking-wider" title="Context-Compressed Codebase (CCC) artifacts detected!">
                  CCC ✓
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 self-end sm:self-center">
          <button 
            onClick={onView} 
            className="w-10 h-10 flex items-center justify-center border-2 border-black bg-white hover:bg-black hover:text-white transition-all text-black" 
            title="View details"
          >
            <Eye className="w-4 h-4" />
          </button>
          
          {!isAnalysisComplete && (
            <button 
              onClick={onExtract} 
              disabled={loading || isAnalysisInProgress || isAgentRunning} 
              className="h-10 px-4 bg-black text-white hover:bg-white hover:text-black border-2 border-black font-mono text-xs uppercase tracking-wider font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              {isAnalysisInProgress ? 'Parsing...' : 'Decompose'}
            </button>
          )}
          
          <button 
            onClick={onDelete} 
            className="w-10 h-10 flex items-center justify-center border-2 border-black bg-red-50 hover:bg-red-600 hover:text-white text-red-600 transition-all" 
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {variant.extractionProgress > 0 && (
        <div className="mt-4 border-t border-dashed border-neutral-200 pt-3">
          <AnalysisProgress progress={variant.extractionProgress} totalSteps={variant.totalExtractionSteps} />
        </div>
      )}
      
      {variant.tokenEstimate !== undefined && (
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2 text-[11px] font-mono text-neutral-500 bg-neutral-50 border border-black p-3">
          <span className="font-bold text-black uppercase">
            [Workspace Context Estimate]
          </span>
          <span>{variant.tokenEstimate.toLocaleString()} tokens</span>
          
          {variant.truncated ? (
            <span className="sm:ml-auto border border-red-600 text-red-600 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-red-50">
              TRUNCATED
            </span>
          ) : (
            <span className="sm:ml-auto border border-black text-black text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-white">
              BUDGET: OK
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default VariantCard;