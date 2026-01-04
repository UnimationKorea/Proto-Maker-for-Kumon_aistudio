import React, { useEffect, useRef, useState } from 'react';
import { ActivityStage } from '../types';

interface ActivityPlayerProps {
  stages: ActivityStage[];
  currentStageIndex: number;
  onNavigate: (index: number) => void;
}

const MASTER_WIDTH = 1280;
const MASTER_HEIGHT = 1024;

const ActivityPlayer: React.FC<ActivityPlayerProps> = ({ stages, currentStageIndex, onNavigate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [scale, setScale] = useState(0.5); // Default start scale
  const [activeSlot, setActiveSlot] = useState(0);

  const stateRef = useRef({
    currentStageIndex,
    activeSlot: 0,
    currentStrokes: [] as any[],
    isMoving: false,
    idleTimer: null as any
  });

  // Scaling Logic
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current?.parentElement) return;
      const parent = containerRef.current.parentElement;
      const padding = 40;
      const horizontalScale = (parent.clientWidth - padding) / MASTER_WIDTH;
      const verticalScale = (parent.clientHeight - padding) / MASTER_HEIGHT;
      const newScale = Math.min(horizontalScale, verticalScale, 1);
      setScale(newScale > 0 ? newScale : 0.5);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current?.parentElement) {
      resizeObserver.observe(containerRef.current.parentElement);
    }
    handleResize();
    return () => resizeObserver.disconnect();
  }, []);

  // Fabric Init
  useEffect(() => {
    const initFabric = () => {
      if (!canvasRef.current || !(window as any).fabric) return;

      const fCanvas = new (window as any).fabric.Canvas(canvasRef.current, {
        width: MASTER_WIDTH,
        height: MASTER_HEIGHT,
        selection: false,
        isDrawingMode: true
      });

      const brush = new (window as any).fabric.PencilBrush(fCanvas);
      brush.color = '#1e293b';
      brush.width = 10;
      fCanvas.freeDrawingBrush = brush;

      setFabricCanvas(fCanvas);
    };

    // Retry if fabric isn't loaded yet
    const timer = setInterval(() => {
      if ((window as any).fabric) {
        clearInterval(timer);
        initFabric();
      }
    }, 100);

    return () => {
      clearInterval(timer);
      if (fabricCanvas) fabricCanvas.dispose();
    };
  }, []);

  // Stage Loader
  useEffect(() => {
    if (!fabricCanvas) return;
    const stage = stages[currentStageIndex];
    if (!stage) return;

    stateRef.current.currentStageIndex = currentStageIndex;
    stateRef.current.activeSlot = 0;
    stateRef.current.currentStrokes = [];
    setActiveSlot(0);

    fabricCanvas.clear();
    fabricCanvas.backgroundColor = '#FFFFFF';

    if (stage.type === 'handwriting') {
      fabricCanvas.isDrawingMode = true;
      renderHandwriting(stage);
    } else if (stage.type === 'drag_drop') {
      fabricCanvas.isDrawingMode = false;
      renderDragDrop(stage);
    } else if (stage.type === 'speech') {
      fabricCanvas.isDrawingMode = false;
      renderSpeech(stage);
    }

    fabricCanvas.renderAll();
  }, [fabricCanvas, currentStageIndex, stages]);

  const renderHandwriting = (stage: ActivityStage) => {
    fabricCanvas.add(new (window as any).fabric.Text(stage.title, {
      left: 60, top: 60, fontSize: 36, fontWeight: 800, fill: '#1e293b', selectable: false
    }));

    if (stage.sentence) {
      const centerY = stage.sentence.y;
      const targets = stage.targets || [];
      
      fabricCanvas.add(new (window as any).fabric.Text(stage.sentence.pre, {
        left: (targets[0]?.x || 0) - 20, top: centerY + 100, fontSize: 64, fontWeight: 700, originX: 'right', selectable: false
      }));

      targets.forEach((t) => {
        fabricCanvas.add(new (window as any).fabric.Rect({
          left: t.x, top: t.y, width: t.width, height: t.height,
          fill: 'rgba(79, 70, 229, 0.03)', stroke: '#e2e8f0', strokeWidth: 2, rx: 12, ry: 12, selectable: false
        }));
      });

      if (stage.sentence.post) {
        const lastT = targets[targets.length - 1];
        fabricCanvas.add(new (window as any).fabric.Text(stage.sentence.post, {
          left: (lastT?.x || 0) + (lastT?.width || 0) + 20, top: centerY + 100, fontSize: 64, fontWeight: 700, originX: 'left', selectable: false
        }));
      }
    }

    if (stage.inputType === 'pad') {
      fabricCanvas.add(new (window as any).fabric.Rect({
        left: 240, top: 680, width: 800, height: 280,
        fill: '#f8fafc', stroke: '#cbd5e1', strokeWidth: 1, rx: 20, ry: 20, selectable: false, evented: false
      }));
    }
  };

  const renderDragDrop = (stage: ActivityStage) => {
    const centerX = MASTER_WIDTH / 2;
    const startX = centerX - ((stage.tokens?.length || 0) - 1) * 120;
    const slots: any[] = [];

    stage.tokens?.forEach((token, i) => {
      const x = startX + i * 240;
      const y = 450;
      fabricCanvas.add(new (window as any).fabric.Text(token.char, {
        left: x, top: y + 80, fontSize: 120, fill: '#1e293b', originX: 'center', selectable: false
      }));
      const slot = new (window as any).fabric.Rect({
        left: x, top: y - 40, width: 140, height: 80, fill: '#f1f5f9', stroke: '#4f46e5', strokeWidth: token.fixed ? 0 : 2, rx: 12, ry: 12, originX: 'center', selectable: false
      });
      fabricCanvas.add(slot);
      if (!token.fixed) slots.push({ x, y: y - 40, token });
    });

    stage.sourceItems?.forEach((item, i) => {
      const group = new (window as any).fabric.Group([
        new (window as any).fabric.Rect({ width: 120, height: 70, fill: '#FFFFFF', stroke: '#cbd5e1', rx: 12, ry: 12, originX: 'center', originY: 'center', shadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }),
        new (window as any).fabric.Text(item, { fontSize: 28, fontWeight: 600, originX: 'center', originY: 'center' })
      ], {
        left: 200 + i * 160, top: 200, hasControls: false, hasBorders: false, hoverCursor: 'pointer'
      });
      group.originalPos = { x: group.left, y: group.top };
      fabricCanvas.add(group);
      group.on('mouseup', () => {
        let matched = false;
        slots.forEach(s => {
          if (Math.abs(group.left - s.x) < 80 && Math.abs(group.top - s.y) < 80) {
            group.animate({ left: s.x, top: s.y }, { duration: 150, onChange: fabricCanvas.renderAll.bind(fabricCanvas) });
            matched = true;
          }
        });
        if (!matched) group.animate({ left: group.originalPos.x, top: group.originalPos.y }, { duration: 300, easing: (window as any).fabric.util.ease.easeOutBack, onChange: fabricCanvas.renderAll.bind(fabricCanvas) });
      });
    });
  };

  const renderSpeech = (stage: ActivityStage) => {
    const centerX = MASTER_WIDTH / 2;
    const centerY = MASTER_HEIGHT / 2;
    const mic = new (window as any).fabric.Circle({
      radius: 100, fill: '#4f46e5', left: centerX, top: centerY + 100, originX: 'center', originY: 'center', hoverCursor: 'pointer', shadow: '0 20px 25px -5px rgb(79 70 229 / 0.3)'
    });
    mic.on('mousedown', () => toggleSpeech(stage));
    fabricCanvas.add(mic);
    fabricCanvas.add(new (window as any).fabric.Text(stage.audioWord || 'Listen & Repeat', {
      left: centerX, top: centerY - 150, fontSize: 80, fontWeight: 900, fill: '#1e293b', originX: 'center', selectable: false
    }));
  };

  const toggleSpeech = (stage: ActivityStage) => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) return alert("STT not supported.");
    if (isRecording) return;
    const recognition = new SpeechRecognition();
    recognition.lang = stage.lang || 'en-US';
    recognition.start();
    setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
  };

  // Strokes Logic
  useEffect(() => {
    if (!fabricCanvas) return;
    const onPathCreated = (e: any) => {
      const stage = stages[stateRef.current.currentStageIndex];
      if (stage.type !== 'handwriting') return;
      stateRef.current.currentStrokes.push(e.path);
      clearTimeout(stateRef.current.idleTimer);
      stateRef.current.idleTimer = setTimeout(() => {
        if (stateRef.current.currentStrokes.length > 0 && !stateRef.current.isMoving) {
          moveStrokes(stage);
        }
      }, 1000);
    };

    const moveStrokes = (stage: ActivityStage) => {
      const target = stage.targets?.[stateRef.current.activeSlot];
      if (!target) return;
      stateRef.current.isMoving = true;
      const strokes = [...stateRef.current.currentStrokes];
      stateRef.current.currentStrokes = [];
      const group = new (window as any).fabric.Group(strokes, { originX: 'center', originY: 'center', selectable: false });
      strokes.forEach(s => fabricCanvas.remove(s));
      fabricCanvas.add(group);
      const br = group.getBoundingRect();
      const scaleF = Math.min(target.width * 0.8 / br.width, target.height * 0.8 / br.height, 1);
      group.animate({
        left: target.x + target.width / 2,
        top: target.y + target.height / 2,
        scaleX: scaleF, scaleY: scaleF
      }, {
        duration: 600, onChange: fabricCanvas.renderAll.bind(fabricCanvas),
        onComplete: () => {
          stateRef.current.isMoving = false;
          stateRef.current.activeSlot++;
          setActiveSlot(stateRef.current.activeSlot);
        }
      });
    };

    fabricCanvas.on('path:created', onPathCreated);
    return () => fabricCanvas.off('path:created', onPathCreated);
  }, [fabricCanvas, stages]);

  return (
    <div className="flex-1 flex items-center justify-center p-8 overflow-hidden bg-slate-100">
      <div 
        ref={containerRef}
        className="canvas-viewport"
        style={{ transform: `scale(${scale})` }}
      >
        <canvas ref={canvasRef} />
        <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-10 pointer-events-none">
          <button 
            disabled={currentStageIndex === 0}
            onClick={() => onNavigate(currentStageIndex - 1)}
            className="pointer-events-auto w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-xl border border-slate-100 disabled:opacity-20 hover:scale-110 active:scale-95 transition-all"
          >
            <svg className="w-8 h-8 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <div className="bg-white/80 backdrop-blur-md px-8 py-3 rounded-full shadow-lg border border-slate-100 text-slate-800 font-bold">
            Stage {currentStageIndex + 1} / {stages.length}
          </div>
          <button 
            disabled={currentStageIndex === stages.length - 1}
            onClick={() => onNavigate(currentStageIndex + 1)}
            className="pointer-events-auto w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-xl border border-slate-100 disabled:opacity-20 hover:scale-110 active:scale-95 transition-all"
          >
            <svg className="w-8 h-8 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6 6-6" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityPlayer;