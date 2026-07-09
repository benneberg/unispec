import React from 'react';
import { Play, AlertTriangle, CheckCircle, Loader2 } from './Icons';

interface AgentControlProps {
  status: 'idle' | 'analyzing' | 'comparing_normalizing' | 'consolidating' | 'generating_visuals' | 'validating' | 'complete' | 'error';
  log: string[];
  onStart: () => void;
  variantsCount: number;
  analyzedVariantsCount: number;
}

const AgentControl: React.FC<AgentControlProps> = ({ status, log, onStart, variantsCount, analyzedVariantsCount }) => {
  const getStatusInfo = () => {
    switch (status) {
      case 'idle':
        return { icon: <Play className="w-4 h-4" />, text: 'System ready', color: 'text-neutral-400 border-neutral-300' };
      case 'analyzing':
        return { icon: <Loader2 className="w-4 h-4 animate-spin" />, text: `Parsing (${analyzedVariantsCount}/${variantsCount})`, color: 'text-[#FF5500] border-[#FF5500]/50 bg-orange-50/30' };
      case 'comparing_normalizing':
        return { icon: <Loader2 className="w-4 h-4 animate-spin" />, text: 'Synthesizing...', color: 'text-[#FF5500] border-[#FF5500]/50 bg-orange-50/30' };
      case 'consolidating':
        return { icon: <Loader2 className="w-4 h-4 animate-spin" />, text: 'Consolidating...', color: 'text-[#FF5500] border-[#FF5500]/50 bg-orange-50/30' };
      case 'generating_visuals':
        return { icon: <Loader2 className="w-4 h-4 animate-spin" />, text: 'Mapping flow...', color: 'text-[#FF5500] border-[#FF5500]/50 bg-orange-50/30' };
      case 'validating':
        return { icon: <Loader2 className="w-4 h-4 animate-spin" />, text: 'Auditing logic...', color: 'text-[#FF5500] border-[#FF5500]/50 bg-orange-50/30' };
      case 'complete':
        return { icon: <CheckCircle className="w-4 h-4" />, text: 'Consolidated ✓', color: 'text-black border-black bg-neutral-50' };
      case 'error':
        return { icon: <AlertTriangle className="w-4 h-4" />, text: 'Pipeline error', color: 'text-red-600 border-red-600/30 bg-red-50' };
      default:
        return { icon: null, text: '', color: '' };
    }
  };

  const { icon, text, color } = getStatusInfo();

  return (
    <div className="bg-white border-2 border-black rounded-none p-6 md:p-8 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
           <h3 className="text-lg font-bold font-display uppercase tracking-tight text-black">
             Orchestration Controller
           </h3>
           <p className="text-xs font-mono text-neutral-400 uppercase mt-0.5">
             [SYSTEM.STAGE_RESOLVER]
           </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <div className={`flex items-center gap-2 px-3 py-2 border-2 text-[10px] font-mono font-bold uppercase tracking-wider ${color}`}>
              {icon}
              <span>{text}</span>
            </div>
            
            <button
              onClick={onStart}
              disabled={status !== 'idle'}
              className="flex-1 md:flex-none px-5 py-3 bg-black text-white hover:bg-neutral-900 border-2 border-black rounded-none font-mono text-xs uppercase tracking-wider font-bold disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all hover:shadow-[3px_3px_0px_0px_#FF5500] active:translate-y-0.5"
            >
              <Play className="w-4 h-4 text-white" />
              <span>Initiate Stack</span>
            </button>
        </div>
      </div>
      
      <div className="border-2 border-black rounded-none p-4 bg-neutral-50 relative">
        <div className="flex items-center gap-2 mb-3">
             <div className="w-1.5 h-1.5 bg-[#FF5500]"></div>
             <div className="w-1.5 h-1.5 bg-black"></div>
             <div className="w-1.5 h-1.5 bg-neutral-300"></div>
             <h4 className="text-[9px] font-mono font-bold uppercase tracking-widest text-neutral-400 ml-1">
               Console Diagnostic Log
             </h4>
        </div>
        <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
          {log.length === 0 ? (
            <p className="text-[10px] italic text-neutral-400 font-mono">
              // waiting for pipeline telemetry output...
            </p>
          ) : (
            log.map((entry, index) => (
              <div key={index} className="flex gap-4 group text-[11px] font-mono">
                <span className="text-[9px] text-neutral-400 font-mono mt-0.5 select-none font-semibold">
                  [{new Date().toLocaleTimeString()}]
                </span>
                <p className="text-neutral-700 font-medium leading-relaxed group-hover:text-black transition-colors">
                  {entry}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentControl;