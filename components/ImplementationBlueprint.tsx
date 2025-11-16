import React from 'react';
import { type ImplementationBlueprint } from '../types';
import { Copy } from './Icons';

const CodeBlock: React.FC<{ title: string; content?: string, lang?: string }> = ({ title, content, lang = 'plaintext' }) => {
    if (!content) return null;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(content);
    };

    return (
        <div className="bg-slate-800/50 rounded-xl p-4 border border-purple-500/20">
            <div className="flex justify-between items-center mb-2">
                <h5 className="font-semibold text-purple-300">{title}</h5>
                <button onClick={copyToClipboard} className="p-2 bg-slate-700 hover:bg-slate-600 rounded" title={`Copy ${title}`}>
                    <Copy className="w-4 h-4" />
                </button>
            </div>
            <pre className={`bg-slate-900 p-4 rounded-lg text-sm overflow-auto max-h-96 whitespace-pre-wrap language-${lang}`}>
                <code>{content}</code>
            </pre>
        </div>
    );
};

const ImplementationBlueprint: React.FC<{ blueprint: ImplementationBlueprint }> = ({ blueprint }) => {
  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-purple-500/20 space-y-6">
      <h3 className="text-xl font-bold">Implementation Blueprint</h3>
      <div className="space-y-6">
        <CodeBlock title="Folder Structure" content={blueprint.folderStructure} />
        <CodeBlock title="package.json" content={blueprint.packageJson} lang="json" />
        <CodeBlock title="Type Definitions" content={blueprint.typeDefinitions} lang="typescript" />
        <CodeBlock title="API Skeletons" content={blueprint.apiSkeletons} lang="typescript" />
        {!blueprint.folderStructure && !blueprint.packageJson && !blueprint.typeDefinitions && !blueprint.apiSkeletons && (
             <p className="text-slate-400">No blueprint data was generated.</p>
        )}
      </div>
    </div>
  );
};

export default ImplementationBlueprint;
