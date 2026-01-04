
import React, { useState } from 'react';
import { Activity, Interaction } from '../types';

interface PreviewProps {
  activity: Activity;
  onClose: () => void;
}

const Preview: React.FC<PreviewProps> = ({ activity, onClose }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  
  const currentSlide = activity.slides[currentIdx];

  const handleInteraction = (interaction?: Interaction) => {
    if (!interaction || interaction.action === 'none') return;

    switch (interaction.action) {
      case 'next_slide':
        if (currentIdx < activity.slides.length - 1) {
          setCurrentIdx(currentIdx + 1);
        } else {
          setShake(true);
          setTimeout(() => setShake(false), 500);
        }
        break;
      case 'prev_slide':
        if (currentIdx > 0) {
          setCurrentIdx(currentIdx - 1);
        }
        break;
      case 'goto_slide':
        if (interaction.targetSlide !== undefined && activity.slides[interaction.targetSlide]) {
          setCurrentIdx(interaction.targetSlide);
        }
        break;
      case 'show_message':
        setFeedback(interaction.message || "Interacted!");
        setTimeout(() => setFeedback(null), 2500);
        break;
      case 'play_sound':
        setFeedback("🔊 [Sound Effect Triggered]");
        setTimeout(() => setFeedback(null), 1500);
        break;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center z-[200] overflow-hidden">
      {/* HUD Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center pointer-events-none z-10">
        <button 
          onClick={onClose} 
          className="pointer-events-auto bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-full backdrop-blur-xl border border-white/20 transition-all flex items-center gap-2 group shadow-xl"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="text-sm font-bold">Exit Preview</span>
        </button>
        
        <div className="bg-black/20 backdrop-blur-xl rounded-full px-6 py-2.5 border border-white/5 shadow-inner">
          <span className="text-white/60 text-xs font-bold uppercase tracking-widest mr-2">Slide</span>
          <span className="text-white font-black text-lg">{currentIdx + 1} <span className="text-white/30 text-sm font-normal">/ {activity.slides.length}</span></span>
        </div>
      </div>

      <div 
        className={`relative aspect-video w-full max-w-[1100px] bg-white overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] transition-all duration-700 ease-in-out ${shake ? 'animate-shake' : ''}`}
        style={{ backgroundColor: currentSlide.backgroundColor }}
      >
        {currentSlide.elements.map((el) => (
          <div
            key={el.id}
            onClick={() => handleInteraction(el.interaction)}
            className={`absolute select-none ${el.interaction && el.interaction.action !== 'none' ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all hover:brightness-110' : ''}`}
            style={{
              left: `${el.x}%`,
              top: `${el.y}%`,
              width: `${el.width}%`,
              height: `${el.height}%`,
              ...el.styles
            }}
          >
            {el.type === 'text' && (
              <div className="w-full h-full flex items-center justify-center p-6 text-center" 
                   style={{ 
                     fontSize: el.styles.fontSize, 
                     textAlign: el.styles.textAlign,
                     fontWeight: el.styles.fontWeight,
                     lineHeight: el.styles.lineHeight,
                     letterSpacing: el.styles.letterSpacing,
                     color: el.styles.color
                   }}>
                {el.content}
              </div>
            )}
            {el.type === 'image' && (
              <img src={el.content} alt="" className="w-full h-full object-cover rounded shadow-sm" />
            )}
            {el.type === 'button' && (
              <div className="w-full h-full flex items-center justify-center px-8 font-black uppercase tracking-widest shadow-lg" 
                   style={{ ...el.styles }}>
                {el.content}
              </div>
            )}
            {el.type === 'shape' && (
              <div className="w-full h-full" style={{ backgroundColor: el.styles.backgroundColor, ...el.styles }} />
            )}
          </div>
        ))}

        {feedback && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
             <div className="bg-indigo-600/95 text-white px-8 py-4 rounded-2xl shadow-[0_20px_50px_rgba(79,70,229,0.3)] font-black text-xl animate-in zoom-in-75 duration-300">
               {feedback}
             </div>
          </div>
        )}
      </div>

      {/* Progress Footer */}
      <div className="absolute bottom-10 w-full max-w-[600px] px-10">
        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
          <div 
            className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all duration-1000 ease-out"
            style={{ width: `${((currentIdx + 1) / activity.slides.length) * 100}%` }}
          />
        </div>
      </div>
      
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
      `}</style>
    </div>
  );
};

export default Preview;
