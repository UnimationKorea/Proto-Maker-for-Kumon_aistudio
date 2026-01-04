
import React from 'react';
import { ActivityElement, Interaction } from '../types';

interface PropertyPanelProps {
  element: ActivityElement | undefined;
  onUpdate: (updates: Partial<ActivityElement>) => void;
  onDelete: () => void;
}

const PropertyPanel: React.FC<PropertyPanelProps> = ({ element, onUpdate, onDelete }) => {
  if (!element) {
    return (
      <aside className="w-80 bg-white border-l border-slate-200 p-8 flex flex-col items-center justify-center text-slate-400 text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-slate-500">Selection empty</p>
        <p className="text-xs text-slate-400 mt-1 px-4 leading-relaxed">Select any item on the canvas to customize its behavior and appearance.</p>
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
        {/* Section: Content */}
        <section className="space-y-4">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Content</h4>
          <div>
            {element.type === 'image' ? (
              <input 
                type="text" 
                value={element.content} 
                onChange={(e) => onUpdate({ content: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                placeholder="Image URL"
              />
            ) : (
              <textarea 
                value={element.content} 
                onChange={(e) => onUpdate({ content: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none h-24 leading-relaxed"
                placeholder="Type your text here..."
              />
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1.5">Width (%)</label>
              <input 
                type="number" 
                value={Math.round(element.width)} 
                onChange={(e) => onUpdate({ width: Number(e.target.value) })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1.5">Height (%)</label>
              <input 
                type="number" 
                value={Math.round(element.height)} 
                onChange={(e) => onUpdate({ height: Number(e.target.value) })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs"
              />
            </div>
          </div>
        </section>

        {/* Section: Typography (New Spacing Controls) */}
        {(element.type === 'text' || element.type === 'button') && (
          <section className="space-y-4">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Typography & Spacing</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1.5">Size (px)</label>
                <input 
                  type="text" 
                  value={element.styles.fontSize || '16px'} 
                  onChange={(e) => setStyle('fontSize', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1.5">Weight</label>
                <select 
                  value={element.styles.fontWeight || 'normal'}
                  onChange={(e) => setStyle('fontWeight', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs"
                >
                  <option value="normal">Normal</option>
                  <option value="600">Semi Bold</option>
                  <option value="bold">Bold</option>
                  <option value="800">Extra Bold</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1.5">Line Height</label>
                <input 
                  type="text" 
                  value={element.styles.lineHeight || '1.5'} 
                  onChange={(e) => setStyle('lineHeight', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs"
                  placeholder="e.g. 1.2, 1.5"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1.5">Letter Spacing</label>
                <input 
                  type="text" 
                  value={element.styles.letterSpacing || 'normal'} 
                  onChange={(e) => setStyle('letterSpacing', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs"
                  placeholder="e.g. 1px, 0.05em"
                />
              </div>
            </div>
          </section>
        )}

        {/* Section: Appearance */}
        <section className="space-y-4">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Appearance</h4>
          <div className="space-y-4">
             <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1.5">Background</label>
              <div className="flex gap-2">
                <input 
                  type="color" 
                  value={element.styles.backgroundColor || '#ffffff'} 
                  onChange={(e) => setStyle('backgroundColor', e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border-slate-200"
                />
                <input 
                  type="text" 
                  value={element.styles.backgroundColor || ''} 
                  onChange={(e) => setStyle('backgroundColor', e.target.value)}
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-xs"
                  placeholder="#Hex"
                />
              </div>
            </div>
            {(element.type === 'button' || element.type === 'shape') && (
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1.5">Corner Radius</label>
                <input 
                  type="text" 
                  value={element.styles.borderRadius || '0px'} 
                  onChange={(e) => setStyle('borderRadius', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs"
                />
              </div>
            )}
          </div>
        </section>

        {/* Section: Interactions */}
        <section className="space-y-4 pb-10">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Interactions</h4>
          <div className="space-y-4">
             <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1.5">On Click Event</label>
              <select 
                value={element.interaction?.action || 'none'} 
                onChange={(e) => handleInteractionChange('action', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-indigo-500 outline-none"
              >
                <option value="none">Disabled</option>
                <option value="next_slide">Go to Next Slide</option>
                <option value="prev_slide">Go to Previous Slide</option>
                <option value="goto_slide">Jump to Slide Index</option>
                <option value="show_message">Show Alert Message</option>
                <option value="play_sound">Play System Sound</option>
              </select>
            </div>
            
            {element.interaction?.action === 'goto_slide' && (
              <div className="animate-in fade-in slide-in-from-top-1">
                <label className="text-[10px] font-bold text-slate-500 block mb-1.5">Slide Index (0-based)</label>
                <input 
                  type="number" 
                  value={element.interaction.targetSlide || 0}
                  onChange={(e) => handleInteractionChange('targetSlide', Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs"
                />
              </div>
            )}

            {element.interaction?.action === 'show_message' && (
              <div className="animate-in fade-in slide-in-from-top-1">
                <label className="text-[10px] font-bold text-slate-500 block mb-1.5">Message Text</label>
                <input 
                  type="text" 
                  value={element.interaction.message || ''}
                  onChange={(e) => handleInteractionChange('message', e.target.value)}
                  placeholder="Perfect!"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs"
                />
              </div>
            )}
          </div>
        </section>
      </div>
    </aside>
  );
};

export default PropertyPanel;
