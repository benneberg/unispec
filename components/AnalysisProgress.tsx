import React from 'react';
import { Check } from './Icons';

interface AnalysisProgressProps {
  progress: number;
  totalSteps: number;
}

const ALL_STAGES = ['Summarize', 'Low-Level', 'Mid-Level', 'High-Level', 'Final Spec'];

const AnalysisProgress: React.FC<AnalysisProgressProps> = ({ progress, totalSteps }) => {
  const stages = totalSteps === 5 ? ALL_STAGES : ALL_STAGES.slice(1);

  return (
    <div>
      <p className="text-sm font-medium text-slate-300 mb-2">Analysis Progress:</p>
      <div className="flex items-center gap-2">
        {stages.map((stage, index) => {
          const step = index + 1;
          const isCompleted = progress >= step;
          const isInProgress = progress === step - 1 && progress < stages.length;

          return (
            <div key={stage} className="flex-1 flex flex-col items-center">
              <div className="flex items-center w-full">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                  isCompleted ? 'bg-green-600' : 'bg-slate-700'
                } ${isInProgress ? 'ring-2 ring-purple-500' : ''}`}>
                  {isCompleted ? <Check className="w-4 h-4" /> : step}
                </div>
                {index < stages.length - 1 && (
                  <div className={`h-1 flex-1 ${isCompleted ? 'bg-green-600' : 'bg-slate-700'}`}></div>
                )}
              </div>
              <p className={`text-xs mt-1 text-center ${isCompleted ? 'text-green-400' : 'text-slate-400'}`}>
                {stage}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnalysisProgress;
