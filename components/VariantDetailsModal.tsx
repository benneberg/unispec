import React, { useState } from 'react';
import { type Variant } from '../types';

interface VariantDetailsModalProps {
  variant: Variant;
  onClose: () => void;
}

const VariantDetailsModal: React.FC<VariantDetailsModalProps> = ({ variant, onClose }) => {
  const hasRepoSummary = !!variant.extractedSpecs?.repositorySummary;
  const hasPipelineResults = !!variant.extractedSpecs?.pipelineResults;
  const hasFinalSpecs = variant.extractionProgress === variant.totalExtractionSteps && variant.extractionProgress > 0;
  
  const getInitialTab = () => {
      if (hasFinalSpecs) return 'final_functional';
      if (hasPipelineResults) return 'pipeline_low';
      if (hasRepoSummary) return 'repo_summary';
      return 'content';
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab());

  const renderContent = () => {
    let contentToDisplay: string | object | undefined | null;

    if (activeTab === 'repo_summary') {
      contentToDisplay = variant.extractedSpecs?.repositorySummary;
    } else if (activeTab.startsWith('pipeline_')) {
      const stage = activeTab.split('_')[1];
      switch (stage) {
        case 'low': contentToDisplay = variant.extractedSpecs?.pipelineResults?.lowLevel; break;
        case 'mid': contentToDisplay = variant.extractedSpecs?.pipelineResults?.midLevel; break;
        case 'high': contentToDisplay = variant.extractedSpecs?.pipelineResults?.highLevel; break;
        default: contentToDisplay = 'Not available.';
      }
    } else if (activeTab.startsWith('final_')) {
      const spec = activeTab.split('_')[1];
      switch (spec) {
        case 'functional': contentToDisplay = variant.extractedSpecs?.functional; break;
        case 'architecture': contentToDisplay = variant.extractedSpecs?.architecture; break;
        case 'datamodel': contentToDisplay = variant.extractedSpecs?.dataModel; break;
        case 'api': contentToDisplay = variant.extractedSpecs?.apiEndpoints; break;
        case 'strengths': contentToDisplay = variant.extractedSpecs?.strengths; break;
        case 'weaknesses': contentToDisplay = variant.extractedSpecs?.weaknesses; break;
        default: contentToDisplay = 'Not available.';
      }
    } else {
        contentToDisplay = variant.rawContent;
    }
    
    return (
      <pre className="bg-slate-900 p-4 rounded-lg text-sm overflow-auto whitespace-pre-wrap">
        {contentToDisplay ? (typeof contentToDisplay === 'string' ? contentToDisplay : JSON.stringify(contentToDisplay, null, 2)) : "No data available for this section yet."}
      </pre>
    )
  };

  const TabButton = ({ id, label }: { id: string, label: string }) => (
    <button onClick={() => setActiveTab(id)} className={`px-4 py-2 font-medium whitespace-nowrap ${activeTab === id ? 'border-b-2 border-purple-500 text-purple-400' : 'text-slate-400'}`}>
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-purple-500/20">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center flex-shrink-0">
          <h3 className="text-2xl font-bold">{variant.name}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full text-2xl leading-none">
            &times;
          </button>
        </div>
        
        <div className="flex-shrink-0 border-b border-slate-700 overflow-x-auto">
            <div className="flex gap-2 px-6 pt-4">
                <TabButton id="content" label="Raw Content" />
                 {hasRepoSummary && (
                    <TabButton id="repo_summary" label="Repo Summary" />
                 )}
                 {hasPipelineResults && (
                    <>
                        <div className="border-l border-slate-600 mx-2"></div>
                        <span className="py-2 font-medium text-slate-500">Pipeline:</span>
                        <TabButton id="pipeline_low" label="Low-Level" />
                        <TabButton id="pipeline_mid" label="Mid-Level" />
                        <TabButton id="pipeline_high" label="High-Level" />
                    </>
                 )}
                 {hasFinalSpecs && (
                    <>
                         <div className="border-l border-slate-600 mx-2"></div>
                         <span className="py-2 font-medium text-slate-500">Final Spec:</span>
                        <TabButton id="final_functional" label="Functional" />
                        <TabButton id="final_architecture" label="Architecture" />
                        <TabButton id="final_datamodel" label="Data Model" />
                        <TabButton id="final_api" label="API" />
                        <TabButton id="final_strengths" label="Strengths" />
                        <TabButton id="final_weaknesses" label="Weaknesses" />
                    </>
                 )}
            </div>
        </div>

        <div className="p-6 overflow-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default VariantDetailsModal;
