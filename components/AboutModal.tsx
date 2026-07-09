import React, { useState } from 'react';
import PrdContent from './PrdContent';
import ArchitectureContent from './ArchitectureContent';

interface AboutModalProps {
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('prd');

  const TabButton = ({ id, label }: { id: string, label: string }) => (
    <button 
      onClick={() => setActiveTab(id)} 
      className={`px-4 py-2 font-mono text-xs uppercase tracking-wider font-bold border-b-2 transition-all ${
        activeTab === id 
          ? 'border-black text-black' 
          : 'border-transparent text-neutral-400 hover:text-black'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
      <div className="bg-white border-2 border-black rounded-none max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="p-5 border-b-2 border-black flex justify-between items-center bg-neutral-50">
          <div>
            <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-black">
              System Specification Blueprint
            </h3>
            <p className="text-[10px] font-mono text-neutral-400 uppercase mt-0.5">
              [UNISPEC_STUDIO.METADATA_REGISTRY]
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center border-2 border-black text-black hover:bg-black hover:text-white transition-all font-bold text-lg" 
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>
        
        <div className="flex px-6 pt-3 border-b border-neutral-200 bg-neutral-50 overflow-x-auto gap-2">
          <TabButton id="prd" label="1. Product Requirements" />
          <TabButton id="architecture" label="2. Technical Design" />
        </div>

        <div className="p-6 overflow-y-auto text-neutral-800 bg-white">
          {activeTab === 'prd' ? <PrdContent /> : <ArchitectureContent />}
        </div>
      </div>
    </div>
  );
};

export default AboutModal;