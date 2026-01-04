import React, { useState } from 'react';
import { Activity, EditorMode } from './types';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ActivityPlayer from './components/ActivityPlayer';
import { generateActivityWithAI } from './services/geminiService';

const INITIAL_ACTIVITY: Activity = {
  title: "Mandarin Basics",
  description: "Learn essential greetings and characters",
  stages: [
    {
      id: "s1",
      type: 'handwriting',
      inputType: 'pad',
      title: "Write 'Hello' (你)",
      instructions: "Use the pad at the bottom to write the character.",
      sentence: { pre: "안녕하세요, ", post: " !", y: 350 },
      targets: [{ x: 500, y: 250, width: 200, height: 200 }]
    },
    {
      id: "s2",
      type: 'drag_drop',
      title: "Pinyin Match",
      tokens: [
        { char: "你", pinyin: "Nǐ", fixed: false },
        { char: "好", pinyin: "hǎo", fixed: false }
      ],
      sourceItems: ["Nǐ", "hǎo"]
    },
    {
      id: "s3",
      type: 'speech',
      title: "Pronunciation Check",
      audioWord: "Nǐ hǎo",
      lang: "zh-CN"
    }
  ]
};

const App: React.FC = () => {
  const [activity, setActivity] = useState<Activity>(INITIAL_ACTIVITY);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [mode, setMode] = useState<EditorMode>('edit');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (prompt: string) => {
    setLoading(true);
    const result = await generateActivityWithAI(prompt);
    if (result) {
      setActivity(result);
      setCurrentIdx(0);
    } else {
      alert("Failed to generate activity. Please try a different prompt.");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-50 overflow-hidden">
      <Header 
        title={activity.title} 
        mode={mode} 
        setMode={setMode} 
        onGenerate={handleGenerate} 
        isLoading={loading}
      />
      
      <main className="flex flex-1 overflow-hidden relative w-full h-full">
        {mode === 'edit' && (
          <Sidebar 
            stages={activity.stages}
            currentIndex={currentIdx}
            onSelect={setCurrentIdx}
          />
        )}
        
        <ActivityPlayer 
          stages={activity.stages}
          currentStageIndex={currentIdx}
          onNavigate={setCurrentIdx}
        />
      </main>

      {loading && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex flex-col items-center justify-center text-white">
          <div className="w-16 h-16 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mb-6" />
          <h2 className="text-2xl font-bold tracking-tight">AI is crafting your interactions...</h2>
          <p className="text-slate-400 mt-2">Generating coordinates and interaction logic.</p>
        </div>
      )}
    </div>
  );
};

export default App;