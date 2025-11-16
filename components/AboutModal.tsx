import React, { useState } from 'react';
import PrdContent from './PrdContent';
import ArchitectureContent from './ArchitectureContent';

interface AboutModalProps {
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('prd');

  const TabButton = ({ id, label }: { id: string, label: string }) => (
    <button onClick={() => setActiveTab(id)} className={`px-4 py-2 font-medium ${activeTab === id ? 'border-b-2 border-purple-500 text-purple-400' : 'text-slate-400'}`}>
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-purple-500/20">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center flex-shrink-0">
          <h3 className="text-2xl font-bold">About App Merger Studio</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full text-2xl leading-none" aria-label="Close modal">
            &times;
          </button>
        </div>
        
        <div className="flex-shrink-0 flex gap-2 px-6 pt-4 border-b border-slate-700 overflow-x-auto">
          <TabButton id="prd" label="Product Requirements (PRD)" />
          <TabButton id="architecture" label="System Architecture" />
        </div>

        <div className="p-6 overflow-auto text-slate-300">
          {activeTab === 'prd' ? <PrdContent /> : <ArchitectureContent />}
        </div>
      </div>
    </div>
  );
};

export default AboutModal;