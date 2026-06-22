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
        return { icon: <Play className="w-5 h-5" />, text: 'Ready to start', color: 'text-slate-300' };
      case 'analyzing':
        return { icon: <Loader2 className="w-5 h-5 animate-spin" />, text: `Analyzing... (${analyzedVariantsCount}/${variantsCount})`, color: 'text-purple-400' };
      case 'comparing_normalizing':
        return { icon: <Loader2 className="w-5 h-5 animate-spin" />, text: 'Comparing & Normalizing...', color: 'text-purple-400' };
      case 'consolidating':
        return { icon: <Loader2 className="w-5 h-5 animate-spin" />, text: 'Consolidating specs...', color: 'text-purple-400' };
      case 'generating_visuals':
        return { icon: <Loader2 className="w-5 h-5 animate-spin" />, text: 'Generating diagrams...', color: 'text-purple-400' };
      case 'validating':
        return { icon: <Loader2 className="w-5 h-5 animate-spin" />, text: 'Validating final spec...', color: 'text-purple-400' };
      case 'complete':
        return { icon: <CheckCircle className="w-5 h-5" />, text: 'Workflow complete!', color: 'text-green-400' };
      case 'error':
        return { icon: <AlertTriangle className="w-5 h-5" />, text: 'Workflow failed', color: 'text-red-400' };
      default:
        return { icon: null, text: '', color: '' };
    }
  };

  const { icon, text, color } = getStatusInfo();

  return (
    <div className="soft-out rounded-[32px] p-8 bg-white/40">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
           <h3 className="text-xl font-black font-display text-slate-800">Orchestration Controller</h3>
           <p className="text-sm text-slate-500 font-medium">Lifecycle management for autonomous analysis</p>
        </div>
        <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-white soft-button font-bold text-xs uppercase tracking-wider ${color}`}>
              {icon}
              <span>{text}</span>
            </div>
            <button
              onClick={onStart}
              disabled={status !== 'idle'}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold tracking-tight disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-3 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Initiate Stack</span>
            </button>
        </div>
      </div>
      
      <div className="soft-in rounded-2xl p-6 bg-slate-50 relative">
        <div className="flex items-center gap-2 mb-4">
             <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
             <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
             <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
             <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Console Output</h4>
        </div>
        <div className="max-h-48 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent pr-2">
          {log.length === 0 ? (
            <p className="text-[10px] italic text-slate-300 font-mono">Standby for orchestration logs...</p>
          ) : (
            log.map((entry, index) => (
              <div key={index} className="flex gap-4 group">
                <span className="text-[9px] text-slate-300 font-mono mt-1 opacity-50 select-none">{new Date().toLocaleTimeString()}</span>
                <p className="text-xs text-slate-600 font-medium font-mono leading-relaxed group-hover:text-blue-600 transition-colors">
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