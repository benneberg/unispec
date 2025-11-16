
import React from 'react';
import { AlertCircle } from './Icons';

interface ErrorMessageProps {
  message: string;
  onClose: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-3">
      <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 flex items-start gap-3" role="alert">
        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">An Error Occurred</p>
          <p className="text-sm text-red-200">{message}</p>
        </div>
        <button onClick={onClose} className="ml-auto text-red-400 hover:text-red-300 font-bold text-xl" aria-label="Close error message">×</button>
      </div>
    </div>
  );
};

export default ErrorMessage;
