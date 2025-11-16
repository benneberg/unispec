
import React from 'react';
import { STEPS } from '../constants';
import { Check, ChevronRight } from './Icons';

interface ProgressStepsProps {
  currentStep: number;
}

const ProgressSteps: React.FC<ProgressStepsProps> = ({ currentStep }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-center sm:justify-between flex-wrap">
        {STEPS.map((step, idx) => (
          <React.Fragment key={idx}>
            <div className="flex items-center p-2">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm sm:text-base ${
                idx <= currentStep ? 'bg-purple-600' : 'bg-slate-700'
              }`}>
                {idx < currentStep ? <Check className="w-5 h-5" /> : idx + 1}
              </div>
              <span className={`ml-2 text-sm font-medium ${idx <= currentStep ? 'text-white' : 'text-slate-400'}`}>{step}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <ChevronRight className="w-5 h-5 text-slate-600 hidden sm:block" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default ProgressSteps;
