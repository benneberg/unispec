import React from 'react';
import { type ComparisonData } from '../types';

const Section: React.FC<{ title: string; content: string | object | undefined }> = ({ title, content }) => {
  const renderContent = () => {
    if (typeof content === 'string') {
      return <pre className="bg-slate-900 p-4 rounded-lg text-sm overflow-auto max-h-96 whitespace-pre-wrap">{content}</pre>;
    }
    if (typeof content === 'object' && content !== null) {
      return <pre className="bg-slate-900 p-4 rounded-lg text-sm overflow-auto max-h-96">{JSON.stringify(content, null, 2)}</pre>;
    }
    return <p className="text-slate-400 italic">Not available.</p>;
  };
  
  return (
    <div>
      <h4 className="text-lg font-bold text-purple-400 mb-2 capitalize">{title.replace(/([A-Z])/g, ' $1')}</h4>
      {renderContent()}
    </div>
  );
};


interface ComparisonResultsDisplayProps {
  data: ComparisonData;
}

const ComparisonResultsDisplay: React.FC<ComparisonResultsDisplayProps> = ({ data }) => {
  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-purple-500/20 space-y-6">
      <h3 className="text-xl font-bold">Comparison Results</h3>
      {Object.entries(data).map(([key, value]) => {
          if (key === 'raw') return null; // Don't display raw fallback
          return <Section key={key} title={key} content={value} />
      })}
      {data.raw && <Section title="Raw Output" content={data.raw} />}
    </div>
  );
};

export default ComparisonResultsDisplay;
