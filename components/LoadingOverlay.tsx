import React from 'react';
import { Loader2 } from './Icons';

interface LoadingOverlayProps {
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message = 'Processing...' }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40" aria-label="Loading">
    <div className="bg-slate-800 rounded-xl p-8 flex flex-col items-center gap-4">
      <Loader2 className="w-12 h-12 animate-spin text-purple-400" />
      <p className="text-lg font-medium">{message}</p>
    </div>
  </div>
);

export default LoadingOverlay;