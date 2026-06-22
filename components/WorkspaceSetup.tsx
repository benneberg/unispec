
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
    <div className="max-w-2xl mx-auto py-12">
      <div className="soft-out rounded-[40px] p-12 bg-white/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
           <Plus className="w-32 h-32" />
        </div>
        <h2 className="text-4xl font-black font-display tracking-tighter text-slate-900 mb-4">Initialize Analysis</h2>
        <p className="text-slate-500 mb-10 leading-relaxed text-lg">
          Connect your application variants to start the consolidation engine. We'll decompose, compare, and harmonize your specs.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="workspaceName" className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3 ml-1">Portfolio Strategy Name</label>
            <input
              id="workspaceName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Enterprise Core Migration"
              className="w-full px-6 py-4 soft-in border-none rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-800 placeholder:text-slate-300 font-medium transition-all"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full px-8 py-5 bg-slate-900 hover:bg-black text-white rounded-2xl font-bold tracking-tight flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] shadow-2xl shadow-slate-900/20"
          >
            <Plus className="w-6 h-6" />
            <span>Launch Workspace</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default WorkspaceSetup;
