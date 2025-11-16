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
    <div className="bg-slate-800/50 rounded-xl p-6 border border-purple-500/20">
      <h3 className="text-xl font-bold mb-4">Autonomous Workflow</h3>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
        <button
          onClick={onStart}
          disabled={status !== 'idle'}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Play className="w-5 h-5" />
          Start Workflow
        </button>
        <div className={`flex items-center gap-2 font-medium ${color}`}>
          {icon}
          <span>{text}</span>
        </div>
      </div>
      <div className="bg-slate-900 rounded p-4 max-h-48 overflow-y-auto">
        <h4 className="text-sm font-semibold mb-2 text-slate-400">Agent Log:</h4>
        <div className="text-xs text-slate-300 space-y-1">
          {log.map((entry, index) => (
            <p key={index} className="whitespace-pre-wrap font-mono">{`[${new Date().toLocaleTimeString()}] ${entry}`}</p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AgentControl;