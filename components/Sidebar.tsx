
import React from 'react';
import { ActivityStage } from '../types';

interface SidebarProps {
  stages: ActivityStage[];
  currentIndex: number;
  onSelect: (index: number) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ stages, currentIndex, onSelect }) => {
  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col">
      <div className="p-6 border-b border-slate-100">
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Activity Stages</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
        {stages.map((stage, i) => (
          <button
            key={stage.id}
            onClick={() => onSelect(i)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${currentIndex === i ? 'bg-indigo-50 border border-indigo-100 text-indigo-900 shadow-sm' : 'hover:bg-slate-50 border border-transparent text-slate-500'}`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${currentIndex === i ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
              {i + 1}
            </div>
            <div className="flex-1 text-left">
              <p className="text-xs font-bold truncate">{stage.title}</p>
              <p className="text-[9px] uppercase font-black opacity-50">{stage.type}</p>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;
