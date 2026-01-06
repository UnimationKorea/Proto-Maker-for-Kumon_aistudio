
import React from 'react';

interface SidebarProps {
  currentIndex: number;
  onSelect: (index: number) => void;
  stages?: any[]; // Keep for compatibility if needed
}

const Sidebar: React.FC<SidebarProps> = ({ currentIndex, onSelect }) => {
  // Slides are hardcoded or managed in App, here we just show the slide list
  const slides = Array.from({ length: 5 }, (_, i) => ({ id: `slide-${i + 1}`, title: `Slide ${i + 1}` }));

  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col z-10">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center">
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Navigation</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
        {slides.map((slide, i) => (
          <button
            key={slide.id}
            onClick={() => onSelect(i)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${currentIndex === i ? 'bg-indigo-50 border border-indigo-100 text-indigo-900 shadow-sm' : 'hover:bg-slate-50 border border-transparent text-slate-500'}`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${currentIndex === i ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-slate-100 text-slate-400'}`}>
              {i + 1}
            </div>
            <div className="flex-1 text-left">
              <p className="text-xs font-bold truncate">{slide.title}</p>
              <p className="text-[9px] uppercase font-black opacity-40">Interactive Layer</p>
            </div>
          </button>
        ))}
        
        <button className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-slate-100 text-slate-300 hover:border-indigo-200 hover:text-indigo-300 transition-all mt-4">
          <div className="w-8 h-8 rounded-lg border-2 border-dashed border-current flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          </div>
          <span className="text-xs font-bold">Add Slide</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
