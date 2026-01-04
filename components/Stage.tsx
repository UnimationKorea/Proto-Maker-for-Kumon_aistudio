
import React, { useRef, useState } from 'react';
import { Slide, ActivityElement } from '../types';

interface StageProps {
  slide: Slide;
  selectedElementId: string | null;
  onSelectElement: (id: string) => void;
  onUpdateElement: (id: string, updates: Partial<ActivityElement>) => void;
}

const Stage: React.FC<StageProps> = ({ slide, selectedElementId, onSelectElement, onUpdateElement }) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<{ id: string; startX: number; startY: number; initialX: number; initialY: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent, el: ActivityElement) => {
    e.stopPropagation();
    onSelectElement(el.id);
    
    setDragState({
      id: el.id,
      startX: e.clientX,
      startY: e.clientY,
      initialX: el.x,
      initialY: el.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState || !stageRef.current) return;
    
    const stageRect = stageRef.current.getBoundingClientRect();
    const currentEl = slide.elements.find(el => el.id === dragState.id);
    if (!currentEl) return;

    const dx = ((e.clientX - dragState.startX) / stageRect.width) * 100;
    const dy = ((e.clientY - dragState.startY) / stageRect.height) * 100;
    
    onUpdateElement(dragState.id, {
      x: Math.max(0, Math.min(100 - currentEl.width, dragState.initialX + dx)),
      y: Math.max(0, Math.min(100 - currentEl.height, dragState.initialY + dy))
    });
  };

  const handleMouseUp = () => {
    setDragState(null);
  };

  if (!slide) return <div className="p-10 text-slate-400 font-medium animate-pulse">Initializing Canvas...</div>;

  return (
    <div 
      ref={stageRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={() => onSelectElement('')}
      className="relative aspect-video w-full max-w-[1000px] shadow-2xl bg-white overflow-hidden rounded-lg border border-slate-200"
      style={{ backgroundColor: slide.backgroundColor }}
    >
      {/* Visual Alignment Aids */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
        style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '5% 5%' }} 
      />

      {slide.elements.map((el) => (
        <div
          key={el.id}
          onMouseDown={(e) => handleMouseDown(e, el)}
          className={`absolute cursor-move select-none transition-shadow group ${selectedElementId === el.id ? 'ring-2 ring-indigo-500 shadow-xl z-20' : 'hover:ring-1 hover:ring-indigo-300 z-10'}`}
          style={{
            left: `${el.x}%`,
            top: `${el.y}%`,
            width: `${el.width}%`,
            height: `${el.height}%`,
            ...el.styles
          }}
        >
          {el.type === 'text' && (
            <div className="w-full h-full flex items-center justify-center p-4 break-words overflow-hidden" 
                 style={{ 
                   fontSize: el.styles.fontSize, 
                   textAlign: el.styles.textAlign,
                   fontWeight: el.styles.fontWeight,
                   lineHeight: el.styles.lineHeight || '1.5',
                   letterSpacing: el.styles.letterSpacing || 'normal'
                 }}>
              {el.content}
            </div>
          )}
          {el.type === 'image' && (
            <img src={el.content} alt="" className="w-full h-full object-cover pointer-events-none" />
          )}
          {el.type === 'button' && (
            <div 
              className="w-full h-full flex items-center justify-center px-6 font-bold pointer-events-none"
              style={{ ...el.styles }}
            >
              {el.content}
            </div>
          )}
          {el.type === 'shape' && (
            <div className="w-full h-full" style={{ backgroundColor: el.styles.backgroundColor || '#94a3b8', ...el.styles }} />
          )}

          {/* Interaction Tag */}
          {el.interaction && el.interaction.action !== 'none' && (
            <div className="absolute -top-3 -left-3 w-6 h-6 bg-amber-400 text-white rounded-full flex items-center justify-center shadow-md border-2 border-white">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
            </div>
          )}
          
          {selectedElementId === el.id && (
            <div className="absolute -bottom-6 left-0 right-0 text-[10px] text-indigo-600 font-bold text-center bg-indigo-50/50 rounded pointer-events-none">
              {Math.round(el.x)}%, {Math.round(el.y)}%
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Stage;
