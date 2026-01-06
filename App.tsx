
import React, { useState } from 'react';
import { Activity } from './types';
import ActivityCanvas from './components/ActivityCanvas';

const INITIAL_ACTIVITY: Activity = {
  title: "구몬 학습 프리미엄",
  stages: [
    { 
      id: 1, type: 'normal', inputType: 'pad', title: "Level 1", 
      sentence: { pre: "나는", post: "에 갑니다.", y: 400 }, 
      targets: [{ x: 440, y: 340, width: 220, height: 120 }] 
    },
    { 
      id: 2, type: 'normal', inputType: 'pad', title: "Level 2", 
      sentence: { pre: "나는", post: "에 갑니다.", y: 400 }, 
      targets: [{ x: 440, y: 340, width: 140, height: 120 }, { x: 600, y: 340, width: 140, height: 120 }] 
    },
    { 
      id: 3, type: 'hint_audio', inputType: 'direct', title: "Level 3", 
      sentence: { pre: "나는", post: "에 갑니다.", y: 400 }, 
      targets: [{ x: 440, y: 340, width: 140, height: 120 }, { x: 600, y: 340, width: 140, height: 120 }], 
      hintText: ["학", "교"], audioWord: "학교" 
    },
    {
      id: 10, type: 'drag_drop', inputType: 'drag', title: "Level 4",
      subText: "당신은 밥을 먹었습니까?",
      tokens: [
        { char: "你", pinyin: "Nǐ", fixed: true },
        { char: "吃", pinyin: "chī", fixed: false },
        { char: "饭", pinyin: "fàn", fixed: true },
        { char: "了", pinyin: "le", fixed: false },
        { char: "吗", pinyin: "ma", fixed: false }
      ],
      sourceItems: ["ma", "chī", "le"]
    }
  ],
  slides: []
};

const App: React.FC = () => {
  const [activity, setActivity] = useState<Activity>(INITIAL_ACTIVITY);
  const [currentIdx, setCurrentIdx] = useState(0);

  return (
    <div className="w-screen h-screen bg-slate-50 flex flex-col">
      {/* 개선된 헤더: 제목 크기 확대 */}
      <div className="h-20 bg-white border-b border-slate-200 px-10 flex items-center justify-between z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <svg className="text-white w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">구몬 프리미엄 학습기</h1>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">{activity.title}</p>
          </div>
        </div>
      </div>
      <div className="flex-1 relative bg-slate-100/50">
        <ActivityCanvas 
          stage={activity.stages[currentIdx]} 
          onNext={() => currentIdx < activity.stages.length - 1 && setCurrentIdx(currentIdx + 1)} 
          onPrev={() => currentIdx > 0 && setCurrentIdx(currentIdx - 1)} 
          isFirst={currentIdx === 0} 
          isLast={currentIdx === activity.stages.length - 1} 
          stageInfo={`${currentIdx + 1}`} 
        />
      </div>
    </div>
  );
};

export default App;
