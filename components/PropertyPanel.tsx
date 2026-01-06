
import React from 'react';
import { ActivityElement, Interaction } from '../types';

interface PropertyPanelProps {
  element: ActivityElement | undefined;
  onUpdate: (updates: Partial<ActivityElement>) => void;
  onDelete: () => void;
  onAdd: (type: ActivityElement['type']) => void;
}

const PropertyPanel: React.FC<PropertyPanelProps> = ({ element, onUpdate, onDelete, onAdd }) => {
  if (!element) {
    return (
      <aside className="w-80 bg-white border-l border-slate-200 p-8 flex flex-col z-10 shadow-sm overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-700">Add New Element</p>
            <p className="text-xs text-slate-400 mt-1 px-4 leading-relaxed">Start building your slide by adding interactive components.</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3 w-full">
            <button onClick={() => onAdd('text')} className="flex flex-col items-center gap-2 p-4 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-xl transition-all group">
              <svg className="w-5 h-5 text-slate-400 group-hover:text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
              <span className="text-[10px] font-black uppercase text-slate-500 group-hover:text-indigo-600">Text</span>
            </button>
            <button onClick={() => onAdd('image')} className="flex flex-col items-center gap-2 p-4 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-xl transition-all group">
              <svg className="w-5 h-5 text-slate-400 group-hover:text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span className="text-[10px] font-black uppercase text-slate-500 group-hover:text-indigo-600">Image</span>
            </button>
            <button onClick={() => onAdd('button')} className="flex flex-col items-center gap-2 p-4 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-xl transition-all group">
              <svg className="w-5 h-5 text-slate-400 group-hover:text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" /></svg>
              <span className="text-[10px] font-black uppercase text-slate-500 group-hover:text-indigo-600">Button</span>
            </button>
            <button onClick={() => onAdd('shape')} className="flex flex-col items-center gap-2 p-4 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-xl transition-all group">
              <svg className="w-5 h-5 text-slate-400 group-hover:text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" /></svg>
              <span className="text-[10px] font-black uppercase text-slate-500 group-hover:text-indigo-600">Shape</span>
            </button>
          </div>
        </div>
      </aside>
    );
  }

  const handleInteractionChange = (field: keyof Interaction, value: any) => {
    const currentInteraction = element.interaction || { trigger: 'click', action: 'none' };
    onUpdate({
      interaction: {
        ...currentInteraction,
        [field]: value
      }
    });
  };

  const setStyle = (field: string, value: any) => {
    onUpdate({ styles: { ...element.styles, [field]: value } });
  };

  const align = (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    switch (type) {
      case 'left': onUpdate({ x: 0 }); break;
      case 'center': onUpdate({ x: 50 - element.width / 2 }); break;
      case 'right': onUpdate({ x: 100 - element.width }); break;
      case 'top': onUpdate({ y: 0 }); break;
      case 'middle': onUpdate({ y: 50 - element.height / 2 }); break;
      case 'bottom': onUpdate({ y: 100 - element.height }); break;
    }
  };

  return (
    <aside className="w-80 bg-white border-l border-slate-200 flex flex-col z-10 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded tracking-tighter">
            {element.type}
          </span>
          <h3 className="text-xs font-bold text-slate-700">Settings</h3>
        </div>
        <button 
          onClick={onDelete} 
          className="text-slate-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg transition-all"
          title="Delete element"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-8">
        {/* Alignment */}
        <section className="space-y-4">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Alignment</h4>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => align('left')} className="p-2 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-lg transition-all flex justify-center"><svg className="w-5 h-5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 2v20M8 6h10v4H8zM8 14h6v4H8z"/></svg></button>
            <button onClick={() => align('center')} className="p-2 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-lg transition-all flex justify-center"><svg className="w-5 h-5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M8 6h8v4H8zM6 14h12v4H6z"/></svg></button>
            <button onClick={() => align('right')} className="p-2 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-lg transition-all flex justify-center"><svg className="w-5 h-5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 2v20M6 6h10v4H6zM10 14h6v4H10z"/></svg></button>
          </div>
        </section>

        {/* Shape Configuration (Specific) */}
        {element.type === 'shape' && (
          <section className="space-y-4">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Shape Config</h4>
            <div className="flex gap-2">
              <button 
                onClick={() => setStyle('borderRadius', '0px')}
                className={`flex-1 py-2 text-[10px] font-bold border rounded-lg transition-all ${element.styles.borderRadius === '0px' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
              >
                Rectangle
              </button>
              <button 
                onClick={() => setStyle('borderRadius', '12px')}
                className={`flex-1 py-2 text-[10px] font-bold border rounded-lg transition-all ${element.styles.borderRadius === '12px' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
              >
                Rounded
              </button>
              <button 
                onClick={() => setStyle('borderRadius', '50%')}
                className={`flex-1 py-2 text-[10px] font-bold border rounded-lg transition-all ${element.styles.borderRadius === '50%' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
              >
                Circle
              </button>
            </div>
          </section>
        )}

        {/* Size & Position */}
        <section className="space-y-4">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Dimensions</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1.5">Width (%)</label>
              <input 
                type="number" 
                value={Math.round(element.width)} 
                onChange={(e) => onUpdate({ width: Number(e.target.value) })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1.5">Height (%)</label>
              <input 
                type="number" 
                value={Math.round(element.height)} 
                onChange={(e) => onUpdate({ height: Number(e.target.value) })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>
        </section>

        {/* Content & Styles */}
        <section className="space-y-4">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Appearance</h4>
          
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1.5">Fill Color</label>
            <div className="flex gap-2">
              <input 
                type="color" 
                value={element.styles.backgroundColor || '#6366f1'} 
                onChange={(e) => setStyle('backgroundColor', e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 p-0 overflow-hidden"
              />
              <input 
                type="text" 
                value={element.styles.backgroundColor || '#6366f1'} 
                onChange={(e) => setStyle('backgroundColor', e.target.value)}
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono uppercase"
              />
            </div>
          </div>

          {element.type !== 'shape' && (
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1.5">Content</label>
              <textarea 
                value={element.content} 
                onChange={(e) => onUpdate({ content: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none resize-none h-20"
                placeholder="Enter content..."
              />
            </div>
          )}
        </section>

        {/* Interactions */}
        <section className="space-y-4 pb-10">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Interactions</h4>
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1.5">Click Action</label>
            <select 
              value={element.interaction?.action || 'none'} 
              onChange={(e) => handleInteractionChange('action', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none"
            >
              <option value="none">No Action</option>
              <option value="next_slide">Next Slide</option>
              <option value="prev_slide">Previous Slide</option>
              <option value="goto_slide">Jump to Slide</option>
              <option value="show_message">Show Message</option>
            </select>
          </div>
        </section>
      </div>
    </aside>
  );
};

export default PropertyPanel;
