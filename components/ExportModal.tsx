
import React, { useState } from 'react';
import { type ConsolidatedDocs } from '../types';
import { BookText, Cable, ClipboardList, Download, Map, Box } from './Icons';

interface ExportModalProps {
  docs: ConsolidatedDocs;
  onClose: () => void;
  onExport: (template: string) => void;
}

const templates = [
  {
    id: 'all',
    icon: <Box className="w-6 h-6 text-purple-400" />,
    title: 'All Individual Files',
    description: 'Download all generated documents as separate files.',
  },
  {
    id: 'prd',
    icon: <BookText className="w-6 h-6 text-green-400" />,
    title: 'Product Requirements Document (.md)',
    description: 'A comprehensive PRD combined with key design decisions.',
  },
  {
    id: 'tdd',
    icon: <ClipboardList className="w-6 h-6 text-blue-400" />,
    title: 'Technical Design Document (.md)',
    description: 'A detailed technical spec for engineers, including all diagrams.',
  },
  {
    id: 'api',
    icon: <Cable className="w-6 h-6 text-yellow-400" />,
    title: 'API Contract (.md)',
    description: 'API skeletons and type definitions for clear implementation.',
  },
  {
    id: 'roadmap',
    icon: <Map className="w-6 h-6 text-orange-400" />,
    title: 'Implementation Roadmap (.md)',
    description: 'Migration plan, folder structure, and package definitions.',
  },
];

const ExportModal: React.FC<ExportModalProps> = ({ docs, onClose, onExport }) => {
  const [selectedTemplate, setSelectedTemplate] = useState('all');

  const handleExport = () => {
    onExport(selectedTemplate);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl max-w-2xl w-full mx-4 border border-purple-500/20">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
            <h3 className="text-xl font-bold">Export Options</h3>
             <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full text-2xl leading-none" aria-label="Close modal">
                &times;
            </button>
        </div>

        <div className="p-6">
            <p className="text-slate-300 mb-4">Select a document template to download.</p>
            <fieldset className="space-y-3">
                <legend className="sr-only">Export Templates</legend>
                {templates.map((template) => (
                    <div key={template.id}>
                        <label
                            htmlFor={template.id}
                            className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                                selectedTemplate === template.id
                                ? 'bg-purple-500/10 border-purple-500'
                                : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                            }`}
                        >
                            <input
                                type="radio"
                                id={template.id}
                                name="export-template"
                                value={template.id}
                                checked={selectedTemplate === template.id}
                                onChange={() => setSelectedTemplate(template.id)}
                                className="sr-only"
                            />
                            <div className="flex-shrink-0">{template.icon}</div>
                            <div>
                                <span className="font-semibold text-white">{template.title}</span>
                                <p className="text-sm text-slate-400">{template.description}</p>
                            </div>
                        </label>
                    </div>
                ))}
            </fieldset>
        </div>

        <div className="flex gap-3 mt-2 p-6 bg-slate-900/50 border-t border-slate-700">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg">
            Cancel
          </button>
          <button onClick={handleExport} className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg flex items-center justify-center gap-2">
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
