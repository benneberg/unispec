
import React, { useState } from 'react';
import { Plus } from './Icons';

interface WorkspaceSetupProps {
  onCreateWorkspace: (name: string) => void;
}

const WorkspaceSetup: React.FC<WorkspaceSetupProps> = ({ onCreateWorkspace }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreateWorkspace(name.trim());
      setName('');
    }
  };

  return (
    <div className="max-w-xl mx-auto py-12 px-4 sm:px-0">
      <div className="bg-white border-2 border-black rounded-none p-8 md:p-12 relative overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="absolute top-4 right-4 font-mono text-[9px] text-neutral-400 font-bold uppercase tracking-widest select-none">
          SYS.INIT // CORE_v2.0
        </div>
        
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tighter text-black mb-4 uppercase">
          Initialize Studio
        </h2>
        
        <p className="text-neutral-600 mb-8 leading-relaxed text-sm font-sans">
          Aggregate, analyze, and unify contrasting application specifications or raw codebases into a single, high-integrity master architecture blueprint.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="workspaceName" className="block text-[11px] font-mono uppercase tracking-widest text-black font-semibold mb-2">
              Portfolio Strategy Name
            </label>
            <input
              id="workspaceName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Enterprise Core Migration"
              className="w-full px-4 py-3.5 bg-white border-2 border-black rounded-none text-black placeholder:text-neutral-400 font-medium transition-all focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] outline-none"
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full px-6 py-4 bg-black text-white hover:bg-neutral-900 border-2 border-black rounded-none font-bold tracking-tight flex items-center justify-center gap-3 transition-all hover:shadow-[3px_3px_0px_0px_#FF5500]"
          >
            <Plus className="w-5 h-5 text-white" />
            <span className="uppercase text-xs font-mono tracking-widest">Launch Workspace</span>
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-dashed border-neutral-200 flex justify-between items-center text-[10px] font-mono text-neutral-400">
          <span>PORTFOLIO SYSTEM ONLINE</span>
          <span>● READY</span>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceSetup;
