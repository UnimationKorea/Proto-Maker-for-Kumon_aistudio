
import React, { useState } from 'react';
import { EditorMode } from '../types';

interface HeaderProps {
  title: string;
  mode: EditorMode;
  setMode: (mode: EditorMode) => void;
  onGenerate: (prompt: string) => void;
  isLoading: boolean;
}

const Header: React.FC<HeaderProps> = ({ title, mode, setMode, onGenerate, isLoading }) => {
  const [prompt, setPrompt] = useState('');
  const [showAI, setShowAI] = useState(false);

  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-50">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" strokeWidth="2" /></svg>
        </div>
        <div>
          <h1 className="text-lg font-black text-slate-800 tracking-tight">Proto Activity Maker</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{title}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={() => setShowAI(!showAI)}
          className="bg-indigo-50 text-indigo-700 px-5 py-2 rounded-full text-sm font-bold border border-indigo-100 hover:bg-indigo-100 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M13 2H7l-1 5h8l-1-5zM4.172 9l.25 1.25L3 12l1.422 1.75L4.172 15h11.656l-.25-1.25L17 12l-1.422-1.75.25-1.25H4.172z" /></svg>
          Ask AI
        </button>

        <div className="h-10 w-[1px] bg-slate-200 mx-2" />

        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setMode('edit')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'edit' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
          >
            Editor
          </button>
          <button 
            onClick={() => setMode('preview')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'preview' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
          >
            Preview
          </button>
        </div>
      </div>

      {showAI && (
        <div className="absolute top-24 right-8 w-96 bg-white shadow-2xl rounded-2xl border border-slate-200 p-6 animate-in slide-in-from-top-4 duration-200">
          <h3 className="text-sm font-black text-slate-800 mb-4 uppercase tracking-wider">What should I build?</h3>
          <textarea 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. 5 stages for learning Japanese fruit names with handwriting and pronunciation..."
            className="w-full h-32 border border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none mb-4"
          />
          <button 
            disabled={isLoading || !prompt.trim()}
            onClick={() => { onGenerate(prompt); setShowAI(false); }}
            className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 transition-all"
          >
            {isLoading ? 'Thinking...' : 'Generate Interaction'}
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;
