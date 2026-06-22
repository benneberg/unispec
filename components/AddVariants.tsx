
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
          <div className="space-y-6">
            <div>
              <label htmlFor="variantNameUpload" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-1">Context Label (Optional)</label>
              <input id="variantNameUpload" type="text" value={variantName} onChange={(e) => setVariantName(e.target.value)} placeholder="e.g., Version 2.0" className="w-full px-5 py-3 soft-in border-none rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"/>
            </div>
            <div className="relative group cursor-pointer">
              <input id="fileUpload" type="file" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"/>
              <div className="w-full h-32 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 group-hover:border-blue-400 group-hover:bg-blue-50 transition-all">
                <Upload className="w-6 h-6 text-slate-400 group-hover:text-blue-500" />
                <p className="text-sm font-bold text-slate-500 group-hover:text-blue-600">Select source documents or code</p>
                <p className="text-[10px] text-slate-400 font-medium">Supporting .ts, .js, .py, .md, .txt</p>
              </div>
            </div>
          </div>
        );
      case 'github':
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="variantNameGithub" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-1">Context Label (Optional)</label>
              <input id="variantNameGithub" type="text" value={variantName} onChange={(e) => setVariantName(e.target.value)} placeholder="e.g., Mainframe Fork" className="w-full px-5 py-3 soft-in border-none rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"/>
            </div>
            <div>
              <label htmlFor="githubUrl" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-1">Repository URL</label>
              <input id="githubUrl" type="text" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/..." className="w-full px-5 py-3 soft-in border-none rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"/>
            </div>
            <button onClick={handleGithubSubmit} disabled={loading || !githubUrl} className="w-full px-6 py-4 bg-slate-900 text-white rounded-xl font-bold tracking-tight disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black shadow-xl shadow-slate-900/10 transition-all">
              Initialize Repository Fetch
            </button>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center">Cloud Ingress • Public Repos Only</p>
          </div>
        );
      case 'manual':
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="variantNameManual" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-1">Context Label</label>
              <input id="variantNameManual" type="text" value={variantName} onChange={(e) => setVariantName(e.target.value)} placeholder="e.g., Abstract Blueprint" className="w-full px-5 py-3 soft-in border-none rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"/>
            </div>
            <div>
              <label htmlFor="manualContent" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-1">Schema / Specification Payload</label>
              <textarea id="manualContent" value={manualContent} onChange={(e) => setManualContent(e.target.value)} placeholder="Paste architectural context or feature sets here..." rows={6} className="w-full px-5 py-3 soft-in border-none rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none shadow-inner"/>
            </div>
            <button onClick={handleManualSubmit} disabled={!variantName || !manualContent} className="w-full px-6 py-4 bg-slate-900 text-white rounded-xl font-bold tracking-tight disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black shadow-xl shadow-slate-900/10 transition-all">
              Push to Registry
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  const TabButton = ({ id, label, icon }: { id: string, label: string, icon: React.ReactNode }) => (
    <button 
      onClick={() => setActiveTab(id)} 
      className={`px-6 py-3 font-bold tracking-tight flex items-center gap-3 rounded-xl transition-all ${
        activeTab === id 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
        : 'text-slate-500 hover:bg-slate-100'
      }`}
    >
      <span className={activeTab === id ? 'text-white' : 'text-slate-400'}>{icon}</span>
      <span className={activeTab === id ? 'text-white' : ''}>{label}</span>
    </button>
  );

  return (
    <div className="soft-out rounded-[32px] p-8 bg-white/40">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-black font-display text-slate-800">Source Selection</h3>
        <div className="flex gap-1 p-1.5 bg-white/50 soft-button rounded-2xl">
          <TabButton id="upload" label="Local" icon={<Upload className="w-4 h-4" />} />
          <TabButton id="github" label="Remote" icon={<Github className="w-4 h-4" />} />
          <TabButton id="manual" label="Direct" icon={<FileText className="w-4 h-4" />} />
        </div>
      </div>
      <div className="mt-8">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default AddVariants;
