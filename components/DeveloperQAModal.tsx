import React, { useState, useRef, useEffect } from 'react';
import { type QAMessage } from '../types';
import { Loader2, Send, Sparkles, User } from './Icons';

interface DeveloperQAModalProps {
  messages: QAMessage[];
  isLoading: boolean;
  onSubmit: (question: string) => void;
  onClose: () => void;
}

const DeveloperQAModal: React.FC<DeveloperQAModalProps> = ({ messages, isLoading, onSubmit, onClose }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSubmit(input);
      setInput('');
    }
  };

  const Message: React.FC<{ message: QAMessage }> = ({ message }) => {
    const isModel = message.role === 'model';
    return (
      <div className={`flex items-start gap-4 ${isModel ? '' : 'flex-row-reverse'}`}>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isModel ? 'bg-purple-600' : 'bg-slate-600'}`}>
          {isModel ? <Sparkles className="w-5 h-5" /> : <User className="w-5 h-5" />}
        </div>
        <div className={`p-4 rounded-lg max-w-xl ${isModel ? 'bg-slate-700' : 'bg-blue-600'}`}>
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl max-w-4xl w-full h-[90vh] flex flex-col overflow-hidden border border-purple-500/20">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl font-bold">Ask the Architect</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full text-2xl leading-none" aria-label="Close modal">
            &times;
          </button>
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {messages.length === 0 && (
            <div className="text-center text-slate-400">
              <p>Ask a question about the project context, such as:</p>
              <ul className="text-sm mt-2 space-y-1">
                <li>"What are the main differences in the data models?"</li>
                <li>"Summarize the migration plan for authentication."</li>
                <li>"Which variant had a stronger implementation of X?"</li>
              </ul>
            </div>
          )}
          {messages.map((msg, index) => <Message key={index} message={msg} />)}
          {isLoading && (
            <div className="flex justify-start">
                 <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-purple-600">
                        <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                     <div className="p-4 rounded-lg bg-slate-700">
                        <p>Thinking...</p>
                    </div>
                </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-slate-700 flex-shrink-0">
          <form onSubmit={handleFormSubmit} className="flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about the variants or the final design..."
              className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-3 bg-purple-600 hover:bg-purple-700 rounded-lg disabled:opacity-50"
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DeveloperQAModal;
