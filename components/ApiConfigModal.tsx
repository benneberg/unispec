
import React, { useState } from 'react';
import { type ApiConfig } from '../types';

interface ApiConfigModalProps {
  config: ApiConfig;
  onSave: (config: ApiConfig) => void;
  onClose: () => void;
}

const ApiConfigModal: React.FC<ApiConfigModalProps> = ({ config, onSave, onClose }) => {
  const [currentConfig, setCurrentConfig] = useState(config);

  const handleSave = () => {
    onSave(currentConfig);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4 border border-purple-500/20">
        <h3 className="text-xl font-bold mb-4">API Configuration</h3>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="provider-select" className="block text-sm font-medium mb-2">Provider</label>
            <select
              id="provider-select"
              value={currentConfig.provider}
              onChange={(e) => setCurrentConfig({...currentConfig, provider: e.target.value as ApiConfig['provider']})}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg"
            >
              <option value="groq">Groq (Fast Inference)</option>
              <option value="openrouter">OpenRouter</option>
            </select>
          </div>

          <div>
            <label htmlFor="api-key-input" className="block text-sm font-medium mb-2">API Key</label>
            {/* SECURITY NOTE: In a production application, API keys should be handled by a secure backend proxy, not exposed on the client-side. */}
            <input
              id="api-key-input"
              type="password"
              value={currentConfig.apiKey}
              onChange={(e) => setCurrentConfig({...currentConfig, apiKey: e.target.value})}
              placeholder="Enter your API key"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg"
            />
          </div>

          <div>
            <label htmlFor="model-input" className="block text-sm font-medium mb-2">Model</label>
            <input
              id="model-input"
              type="text"
              value={currentConfig.model}
              onChange={(e) => setCurrentConfig({...currentConfig, model: e.target.value})}
              placeholder="Model name, e.g., mixtral-8x7b-32768"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg"
            />
          </div>

          <div className="text-xs text-purple-300 bg-purple-500/10 p-3 rounded">
            <p className="font-medium mb-1">Get API Keys:</p>
            <p>• Groq: <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="underline">console.groq.com</a></p>
            <p>• OpenRouter: <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="underline">openrouter.ai</a></p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg">
            Close
          </button>
          <button onClick={handleSave} className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg">
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiConfigModal;
