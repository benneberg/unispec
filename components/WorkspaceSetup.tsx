
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
    <div className="max-w-2xl mx-auto">
      <div className="bg-slate-800/50 rounded-xl p-8 border border-purple-500/20">
        <h2 className="text-3xl font-bold mb-4">Create New Workspace</h2>
        <p className="text-purple-300 mb-6">
          Start by creating a workspace to organize your app variants and consolidation process.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="workspaceName" className="block text-sm font-medium mb-2">Workspace Name</label>
            <input
              id="workspaceName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Mobile App Consolidation"
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Workspace
          </button>
        </form>
      </div>
    </div>
  );
};

export default WorkspaceSetup;
