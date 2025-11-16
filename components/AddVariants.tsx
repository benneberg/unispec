
import React, { useState } from 'react';
import { Upload, Github, FileText } from './Icons';

interface AddVariantsProps {
  onFileUpload: (file: File, variantName: string) => void;
  onGithubClone: (repoUrl: string, variantName: string) => void;
  onManualSpec: (variantData: { name: string; sourceType: 'manual'; rawContent: string }) => void;
  loading: boolean;
}

const AddVariants: React.FC<AddVariantsProps> = ({ onFileUpload, onGithubClone, onManualSpec, loading }) => {
  const [activeTab, setActiveTab] = useState('upload');
  const [variantName, setVariantName] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [manualContent, setManualContent] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file, variantName);
      setVariantName('');
    }
  };

  const handleGithubSubmit = () => {
    if (githubUrl) {
      onGithubClone(githubUrl, variantName);
      setGithubUrl('');
      setVariantName('');
    }
  };

  const handleManualSubmit = () => {
    if (variantName && manualContent) {
      onManualSpec({ name: variantName, sourceType: 'manual', rawContent: manualContent });
      setManualContent('');
      setVariantName('');
    }
  };
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'upload':
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="variantNameUpload" className="block text-sm font-medium mb-2">Variant Name (Optional)</label>
              <input id="variantNameUpload" type="text" value={variantName} onChange={(e) => setVariantName(e.target.value)} placeholder="e.g., App Version 1" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg"/>
            </div>
            <div>
              <label htmlFor="fileUpload" className="block text-sm font-medium mb-2">Upload Code or Spec File</label>
              <input id="fileUpload" type="file" onChange={handleFileChange} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-purple-600 file:text-white hover:file:bg-purple-700"/>
            </div>
            <p className="text-sm text-slate-400">Upload source code files (.js, .py, .ts, etc.) or text documents (.md, .txt).</p>
          </div>
        );
      case 'github':
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="variantNameGithub" className="block text-sm font-medium mb-2">Variant Name (Optional)</label>
              <input id="variantNameGithub" type="text" value={variantName} onChange={(e) => setVariantName(e.target.value)} placeholder="e.g., Production App" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg"/>
            </div>
            <div>
              <label htmlFor="githubUrl" className="block text-sm font-medium mb-2">GitHub Repository URL</label>
              <input id="githubUrl" type="text" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/username/repo" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg"/>
            </div>
            <button onClick={handleGithubSubmit} disabled={loading || !githubUrl} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg disabled:opacity-50">
              Clone Repository
            </button>
            <p className="text-sm text-slate-400">Public repositories only. For private repos, please use file upload instead.</p>
          </div>
        );
      case 'manual':
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="variantNameManual" className="block text-sm font-medium mb-2">Variant Name</label>
              <input id="variantNameManual" type="text" value={variantName} onChange={(e) => setVariantName(e.target.value)} placeholder="e.g., Concept Design" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg"/>
            </div>
            <div>
              <label htmlFor="manualContent" className="block text-sm font-medium mb-2">Specification Content</label>
              <textarea id="manualContent" value={manualContent} onChange={(e) => setManualContent(e.target.value)} placeholder="Paste your app specification, features list, or technical documentation..." rows={8} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg"/>
            </div>
            <button onClick={handleManualSubmit} disabled={!variantName || !manualContent} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg disabled:opacity-50">
              Add Variant
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  const TabButton = ({ id, label, icon }: { id: string, label: string, icon: React.ReactNode }) => (
    <button onClick={() => setActiveTab(id)} className={`px-4 py-2 font-medium flex items-center gap-2 ${activeTab === id ? 'border-b-2 border-purple-500 text-purple-400' : 'text-slate-400'}`}>
      {icon} {label}
    </button>
  );

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-purple-500/20">
      <h3 className="text-xl font-bold mb-4">Add Variant</h3>
      <div className="flex gap-2 mb-6 border-b border-slate-700">
        <TabButton id="upload" label="Upload File" icon={<Upload className="w-4 h-4" />} />
        <TabButton id="github" label="GitHub Repo" icon={<Github className="w-4 h-4" />} />
        <TabButton id="manual" label="Manual Input" icon={<FileText className="w-4 h-4" />} />
      </div>
      {renderTabContent()}
    </div>
  );
};

export default AddVariants;
