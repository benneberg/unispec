
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
              <label htmlFor="variantNameUpload" className="block text-[11px] font-mono uppercase tracking-widest text-black font-semibold mb-2">
                Context Label (Optional)
              </label>
              <input 
                id="variantNameUpload" 
                type="text" 
                value={variantName} 
                onChange={(e) => setVariantName(e.target.value)} 
                placeholder="e.g., Version 2.0" 
                className="w-full px-4 py-3 bg-white border-2 border-black rounded-none text-black placeholder:text-neutral-400 font-medium outline-none focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
              />
            </div>
            <div className="relative group cursor-pointer">
              <input 
                id="fileUpload" 
                type="file" 
                onChange={handleFileChange} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="w-full h-36 border-2 border-dashed border-black rounded-none bg-neutral-50/50 flex flex-col items-center justify-center gap-2 group-hover:bg-neutral-100 transition-all p-4">
                <Upload className="w-5 h-5 text-black" />
                <p className="text-xs font-mono font-bold uppercase text-black text-center">
                  Drag / Tap to Select Code or Spec Document
                </p>
                <p className="text-[10px] font-mono text-neutral-400">
                  Supporting: .ts, .js, .py, .md, .txt
                </p>
              </div>
            </div>
          </div>
        );
      case 'github':
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="variantNameGithub" className="block text-[11px] font-mono uppercase tracking-widest text-black font-semibold mb-2">
                Context Label (Optional)
              </label>
              <input 
                id="variantNameGithub" 
                type="text" 
                value={variantName} 
                onChange={(e) => setVariantName(e.target.value)} 
                placeholder="e.g., Mainframe Fork" 
                className="w-full px-4 py-3 bg-white border-2 border-black rounded-none text-black placeholder:text-neutral-400 font-medium outline-none focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
              />
            </div>
            <div>
              <label htmlFor="githubUrl" className="block text-[11px] font-mono uppercase tracking-widest text-black font-semibold mb-2">
                Repository URL
              </label>
              <input 
                id="githubUrl" 
                type="text" 
                value={githubUrl} 
                onChange={(e) => setGithubUrl(e.target.value)} 
                placeholder="https://github.com/..." 
                className="w-full px-4 py-3 bg-white border-2 border-black rounded-none text-black placeholder:text-neutral-400 font-medium outline-none focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
              />
            </div>
            <button 
              onClick={handleGithubSubmit} 
              disabled={loading || !githubUrl} 
              className="w-full py-4 bg-black text-white hover:bg-neutral-900 border-2 border-black rounded-none text-xs font-mono font-bold uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-0.5"
            >
              Initialize Repository Fetch
            </button>
            <div className="border border-black bg-orange-50 border-l-4 border-l-[#FF5500] p-4 text-left space-y-1 rounded-none">
              <span className="text-[11px] font-mono font-bold text-black uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#FF5500] inline-block rounded-full"></span>
                Context-Compressed Codebases (CCC)
              </span>
              <p className="text-[11px] text-neutral-700 leading-relaxed font-sans">
                Pre-compile structured context in a <code className="font-mono bg-white border border-neutral-300 px-1 rounded text-black text-[10px]">.llm-context/</code> directory inside your repository. UniSpec will automatically ingest these files to bypass standard extraction passes.
              </p>
            </div>
          </div>
        );
      case 'manual':
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="variantNameManual" className="block text-[11px] font-mono uppercase tracking-widest text-black font-semibold mb-2">
                Context Label
              </label>
              <input 
                id="variantNameManual" 
                type="text" 
                value={variantName} 
                onChange={(e) => setVariantName(e.target.value)} 
                placeholder="e.g., Abstract Blueprint" 
                className="w-full px-4 py-3 bg-white border-2 border-black rounded-none text-black placeholder:text-neutral-400 font-medium outline-none focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
              />
            </div>
            <div>
              <label htmlFor="manualContent" className="block text-[11px] font-mono uppercase tracking-widest text-black font-semibold mb-2">
                Schema / Specification Payload
              </label>
              <textarea 
                id="manualContent" 
                value={manualContent} 
                onChange={(e) => setManualContent(e.target.value)} 
                placeholder="Paste architectural context or feature sets here..." 
                rows={6} 
                className="w-full px-4 py-3 bg-white border-2 border-black rounded-none text-black placeholder:text-neutral-400 font-medium outline-none focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all resize-none"
              />
            </div>
            <button 
              onClick={handleManualSubmit} 
              disabled={!variantName || !manualContent} 
              className="w-full py-4 bg-black text-white hover:bg-neutral-900 border-2 border-black rounded-none text-xs font-mono font-bold uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-0.5"
            >
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
      className={`px-4 py-2.5 font-mono text-xs uppercase tracking-wider flex items-center gap-2 border-2 transition-all ${
        activeTab === id 
        ? 'bg-black text-white border-black' 
        : 'bg-white text-black border-transparent hover:border-black'
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );

  return (
    <div className="bg-white border-2 border-black rounded-none p-6 md:p-8 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h3 className="text-lg font-bold font-display uppercase tracking-tight text-black">
            Variant Ingest Station
          </h3>
          <p className="text-xs font-mono text-neutral-400 uppercase mt-0.5">
            [MODE_SELECTOR = MANIFEST_INPUT]
          </p>
        </div>
        <div className="flex border-2 border-black p-1 bg-white">
          <TabButton id="upload" label="Local" icon={<Upload className="w-3.5 h-3.5" />} />
          <TabButton id="github" label="Remote" icon={<Github className="w-3.5 h-3.5" />} />
          <TabButton id="manual" label="Direct" icon={<FileText className="w-3.5 h-3.5" />} />
        </div>
      </div>
      <div className="mt-6">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default AddVariants;
