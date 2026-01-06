
import React, { useState, useEffect } from 'react';
import { Activity, ActivityElement, Slide, EditorMode } from './types';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Stage from './components/Stage';
import PropertyPanel from './components/PropertyPanel';
import Preview from './components/Preview';
import { generateActivityWithAI } from './services/geminiService';

const INITIAL_ACTIVITY: Activity = {
  title: "Premium Learning Activity",
  stages: [],
  slides: [
    {
      id: 'slide-1',
      backgroundColor: '#ffffff',
      elements: [
        {
          id: 'el-1',
          type: 'text',
          x: 10,
          y: 10,
          width: 80,
          height: 20,
          content: 'Welcome to Proto Maker! Select this text to edit properties or add new elements from the right panel.',
          styles: { fontSize: '24px', fontWeight: '800', textAlign: 'center', color: '#1e293b' }
        }
      ]
    }
  ]
};

const App: React.FC = () => {
  const [activity, setActivity] = useState<Activity>(INITIAL_ACTIVITY);
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<EditorMode>('edit');
  const [isLoading, setIsLoading] = useState(false);

  const currentSlide = activity.slides[currentSlideIdx];
  const selectedElement = currentSlide?.elements.find(el => el.id === selectedId);

  const handleAddElement = (type: ActivityElement['type']) => {
    const newElement: ActivityElement = {
      id: `el-${Date.now()}`,
      type,
      x: 35,
      y: 40,
      width: type === 'shape' ? 15 : 30,
      height: type === 'shape' ? 15 : 10,
      content: type === 'text' ? 'New Text' : type === 'button' ? 'Click Me' : '',
      styles: type === 'shape' ? { backgroundColor: '#6366f1', borderRadius: '8px' } : 
              type === 'button' ? { backgroundColor: '#6366f1', color: '#ffffff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyCenter: 'center' } :
              { fontSize: '18px', color: '#1e293b' },
      interaction: { trigger: 'click', action: 'none' }
    };

    const newSlides = [...activity.slides];
    newSlides[currentSlideIdx] = {
      ...currentSlide,
      elements: [...currentSlide.elements, newElement]
    };
    setActivity({ ...activity, slides: newSlides });
    setSelectedId(newElement.id);
  };

  const updateElement = (id: string, updates: Partial<ActivityElement>) => {
    const newSlides = [...activity.slides];
    newSlides[currentSlideIdx] = {
      ...currentSlide,
      elements: currentSlide.elements.map(el => el.id === id ? { ...el, ...updates } : el)
    };
    setActivity({ ...activity, slides: newSlides });
  };

  const deleteElement = (id: string) => {
    const newSlides = [...activity.slides];
    newSlides[currentSlideIdx] = {
      ...currentSlide,
      elements: currentSlide.elements.filter(el => el.id !== id)
    };
    setActivity({ ...activity, slides: newSlides });
    setSelectedId(null);
  };

  const handleAI = async (prompt: string) => {
    setIsLoading(true);
    const newActivity = await generateActivityWithAI(prompt);
    if (newActivity) {
      setActivity(newActivity);
      setCurrentSlideIdx(0);
    }
    setIsLoading(false);
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-50 font-['Inter'] overflow-hidden">
      <Header 
        title={activity.title} 
        mode={mode} 
        setMode={setMode} 
        onGenerate={handleAI}
        isLoading={isLoading}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar 
          stages={activity.stages} // Keeping original stages for reference if needed
          currentIndex={currentSlideIdx}
          onSelect={setCurrentSlideIdx}
        />
        
        <main className="flex-1 bg-slate-100 flex items-center justify-center p-12 overflow-auto relative">
          <Stage 
            slide={currentSlide}
            selectedElementId={selectedId}
            onSelectElement={setSelectedId}
            onUpdateElement={updateElement}
          />
        </main>

        <PropertyPanel 
          element={selectedElement}
          onUpdate={(updates) => selectedId && updateElement(selectedId, updates)}
          onDelete={() => selectedId && deleteElement(selectedId)}
          onAdd={handleAddElement}
        />
      </div>

      {mode === 'preview' && (
        <Preview activity={activity} onClose={() => setMode('edit')} />
      )}
    </div>
  );
};

export default App;
