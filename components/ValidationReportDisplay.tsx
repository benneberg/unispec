import React from 'react';
import { type ValidationReport, type ValidationFinding } from '../types';
import { ShieldCheck, ShieldX, FileWarning } from './Icons';

const getFindingDetails = (type: ValidationFinding['type']) => {
  switch (type) {
    case 'lost':
      return {
        icon: <ShieldX className="w-5 h-5 text-red-400" />,
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
        title: 'Lost Feature/Requirement',
      };
    case 'misrepresented':
      return {
        icon: <FileWarning className="w-5 h-5 text-yellow-400" />,
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/30',
        title: 'Misrepresented Feature',
      };
    case 'confirmed':
      return {
        icon: <ShieldCheck className="w-5 h-5 text-green-400" />,
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30',
        title: 'Confirmed Feature',
      };
    default:
      return {
        icon: null,
        bgColor: 'bg-slate-700',
        borderColor: 'border-slate-600',
        title: 'Finding',
      };
  }
};

const ValidationReportDisplay: React.FC<{ report: ValidationReport }> = ({ report }) => {
  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-purple-500/20 space-y-6">
      <div>
        <h3 className="text-xl font-bold">Validation Report</h3>
        <p className="text-purple-300 mt-1">AI-driven check to ensure no critical features were lost during consolidation.</p>
      </div>
      
      <div className="bg-slate-900 p-4 rounded-lg">
        <h4 className="font-semibold text-purple-400 mb-2">QA Summary:</h4>
        <p className="text-slate-300 text-sm">{report.summary}</p>
      </div>

      <div>
        <h4 className="text-lg font-bold mb-3">Detailed Findings</h4>
        <div className="space-y-3">
          {report.findings?.length > 0 ? (
            report.findings.map((finding, index) => {
              const details = getFindingDetails(finding.type);
              return (
                <div key={index} className={`p-4 rounded-lg border ${details.bgColor} ${details.borderColor}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">{details.icon}</div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-2">
                        <span className="font-semibold">{details.title}</span>
                        <div className="flex items-center gap-2">
                           <span className="text-xs bg-slate-700 px-2 py-1 rounded-full">Variant: {finding.variant}</span>
                           <span className="text-xs bg-slate-700 px-2 py-1 rounded-full">Area: {finding.area}</span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-300">{finding.finding}</p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-slate-400 italic">No specific findings reported by the validation agent.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ValidationReportDisplay;