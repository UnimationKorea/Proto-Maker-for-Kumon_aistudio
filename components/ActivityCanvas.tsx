
import React, { useEffect, useRef, useState } from 'react';
import { ActivityStage, Target } from '../types';

interface ActivityCanvasProps {
  stage: ActivityStage;
  onNext: () => void;
  onPrev: () => void;
  isFirst: boolean;
  isLast: boolean;
  stageInfo: string;
}

const MASTER_WIDTH = 1280;
const MASTER_HEIGHT = 1024;
const IDLE_TIMEOUT = 1500;
const CLUSTER_GAP = 45;

const ActivityCanvas: React.FC<ActivityCanvasProps> = ({ stage, onNext, onPrev, isFirst, isLast, stageInfo }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fCanvas, setFCanvas] = useState<any>(null);
  const [scale, setScale] = useState(1);
  const [activeSlotIdx, setActiveSlotIdx] = useState(0);

  // 로직 관리를 위한 Ref
  const stateRef = useRef({
    currentStrokes: [] as any[],
    idleTimer: null as any,
    isMoving: false,
    activeSlotIdx: 0,
    filledSlots: [] as boolean[],
    dropTargets: [] as any[]
  });

  // 1. 오토 스케일링 엔진
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current?.parentElement) return;
      const parent = containerRef.current.parentElement;
      const padding = 20;
      const s = Math.min(
        (parent.clientWidth - padding) / MASTER_WIDTH,
        (parent.clientHeight - padding) / MASTER_HEIGHT
      );
      setScale(s > 0 ? s : 1);
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 2. Fabric 캔버스 초기화
  useEffect(() => {
    if (!canvasRef.current || (window as any).fabricCanvasInstance) return;

    const fabric = (window as any).fabric;
    if (!fabric) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: MASTER_WIDTH,
      height: MASTER_HEIGHT,
      selection: false,
      isDrawingMode: true,
      backgroundColor: '#ffffff'
    });

    const brush = new fabric.PencilBrush(canvas);
    brush.color = '#1e293b';
    brush.width = 7;
    canvas.freeDrawingBrush = brush;

    setFCanvas(canvas);
    (window as any).fabricCanvasInstance = canvas;

    return () => {
      canvas.dispose();
      (window as any).fabricCanvasInstance = null;
    };
  }, []);

  // 3. 스테이지 렌더링
  useEffect(() => {
    if (!fCanvas) return;

    fCanvas.clear();
    fCanvas.backgroundColor = '#ffffff';
    stateRef.current.activeSlotIdx = 0;
    stateRef.current.currentStrokes = [];
    stateRef.current.filledSlots = new Array(stage.targets?.length || 0).fill(false);
    stateRef.current.dropTargets = [];
    setActiveSlotIdx(0);

    if (stage.inputType === 'drag') {
      fCanvas.isDrawingMode = false;
      renderDragStage();
    } else {
      fCanvas.isDrawingMode = true;
      renderWritingStage();
    }

    fCanvas.renderAll();
  }, [fCanvas, stage]);

  const renderWritingStage = () => {
    const fabric = (window as any).fabric;
    
    // Sentence UI
    if (stage.sentence && stage.targets) {
      const centerY = stage.sentence.y + stage.targets[0].height / 2;
      
      fCanvas.add(new fabric.Text(stage.sentence.pre, {
        left: stage.targets[0].x - 40, top: centerY,
        fontSize: 56, fontWeight: 700, fill: '#1e293b', originX: 'right', originY: 'center', selectable: false
      }));

      stage.targets.forEach((t, i) => {
        fCanvas.add(new fabric.Rect({
          left: t.x, top: t.y, width: t.width, height: t.height,
          fill: 'rgba(79, 70, 229, 0.02)', stroke: '#e2e8f0', strokeWidth: 2, rx: 16, ry: 16, selectable: false
        }));
      });

      const lastT = stage.targets[stage.targets.length - 1];
      fCanvas.add(new fabric.Text(stage.sentence.post, {
        left: lastT.x + lastT.width + 40, top: centerY,
        fontSize: 56, fontWeight: 700, fill: '#1e293b', originX: 'left', originY: 'center', selectable: false
      }));
    }

    // Input Pad
    if (stage.inputType === 'pad') {
      fCanvas.add(new fabric.Rect({
        left: 240, top: 640, width: 800, height: 280,
        fill: '#f8fafc', stroke: '#e2e8f0', strokeWidth: 1.5, rx: 20, ry: 20, selectable: false, evented: false
      }));
      fCanvas.add(new fabric.Text("여기에 써보세요", {
        left: 264, top: 664, fontSize: 16, fill: '#64748b', fontWeight: 600, selectable: false
      }));
    }

    // 힌트 텍스트
    if (stage.hintText && stage.targets) {
      stage.targets.forEach((t, i) => {
        const hint = new fabric.Text(stage.hintText![i], {
          left: t.x + t.width / 2, top: t.y + t.height / 2,
          fontSize: 64, fontWeight: 700, fill: '#94a3b8', opacity: 0.3, originX: 'center', originY: 'center', selectable: false
        });
        fCanvas.add(hint);
        setTimeout(() => {
          hint.animate('opacity', 0, { duration: 1000, onComplete: () => fCanvas.remove(hint) });
        }, 2000);
      });
    }
  };

  const renderDragStage = () => {
    const fabric = (window as any).fabric;
    const centerX = MASTER_WIDTH / 2;
    
    // 배경 플레이트
    fCanvas.add(new fabric.Rect({
      left: centerX, top: 450, width: 940, height: 480,
      fill: '#ffffff', stroke: '#e2e8f0', strokeWidth: 2, rx: 32, ry: 32, originX: 'center', originY: 'center', selectable: false, shadow: '0 10px 30px rgba(0,0,0,0.05)'
    }));

    if (stage.tokens) {
      const gap = 160;
      const startX = centerX - (stage.tokens.length - 1) * gap / 2;
      
      stage.tokens.forEach((token, i) => {
        const x = startX + i * gap;
        const y = 450;

        // 한자
        fCanvas.add(new fabric.Text(token.char, {
          left: x, top: y + 40, fontSize: 100, fontWeight: 700, fill: '#1e293b', originX: 'center', selectable: false
        }));

        // 병음 슬롯
        if (token.fixed) {
          fCanvas.add(new fabric.Text(token.pinyin, {
            left: x, top: y - 15, fontSize: 32, fontWeight: 700, fill: '#4f46e5', originX: 'center', originY: 'center', selectable: false
          }));
        } else {
          const slot = new fabric.Rect({
            left: x, top: y - 15, width: 120, height: 70,
            fill: 'rgba(79, 70, 229, 0.03)', stroke: '#4f46e5', strokeWidth: 2, strokeDashArray: [6, 4], rx: 12, ry: 12, originX: 'center', originY: 'center', selectable: false
          });
          fCanvas.add(slot);
          stateRef.current.dropTargets.push({ x, y: y - 15, slot });
        }
      });
    }

    // 드래그 아이템 (상단 바)
    fCanvas.add(new fabric.Rect({
      left: centerX, top: 180, width: 1000, height: 110, fill: '#f1f5f9', rx: 20, ry: 20, originX: 'center', originY: 'center', selectable: false
    }));

    if (stage.sourceItems) {
      const gap = 190;
      const startX = centerX - (stage.sourceItems.length - 1) * gap / 2;
      stage.sourceItems.forEach((item, i) => {
        const group = new fabric.Group([
          new fabric.Rect({ width: 120, height: 68, fill: '#ffffff', stroke: '#e2e8f0', rx: 12, ry: 12, originX: 'center', originY: 'center', shadow: '0 4px 10px rgba(0,0,0,0.08)' }),
          new fabric.Text(item, { fontSize: 26, fontWeight: 700, fill: '#1e293b', originX: 'center', originY: 'center' })
        ], {
          left: startX + i * gap, top: 180, originX: 'center', originY: 'center', hasControls: false, hasBorders: false, hoverCursor: 'pointer'
        });
        group.originalPos = { x: group.left, y: group.top };
        fCanvas.add(group);

        group.on('mouseup', () => {
          let snapped = false;
          for (const target of stateRef.current.dropTargets) {
            if (Math.abs(group.left - target.x) < 60 && Math.abs(group.top - target.y) < 60) {
              group.animate({ left: target.x, top: target.y }, {
                duration: 150, onChange: fCanvas.renderAll.bind(fCanvas),
                onComplete: () => {
                  target.slot.set({ strokeWidth: 0, fill: 'transparent' });
                  group.item(0).set({ fill: 'transparent', strokeWidth: 0 });
                  group.item(1).set({ fill: '#4f46e5', fontSize: 32 });
                  fCanvas.renderAll();
                }
              });
              snapped = true;
              break;
            }
          }
          if (!snapped) {
            group.animate({ left: group.originalPos.x, top: group.originalPos.y }, { duration: 300, easing: fabric.util.ease.easeOutBack, onChange: fCanvas.renderAll.bind(fCanvas) });
          }
        });
      });
    }
  };

  // 4. 필기 자동 이동 로직 (Idle Placement)
  useEffect(() => {
    if (!fCanvas) return;

    const onPathCreated = (e: any) => {
      if (stateRef.current.isMoving) {
        fCanvas.remove(e.path);
        return;
      }
      stateRef.current.currentStrokes.push(e.path);
      clearTimeout(stateRef.current.idleTimer);
      stateRef.current.idleTimer = setTimeout(() => {
        performPlacement();
      }, IDLE_TIMEOUT);
    };

    const performPlacement = () => {
      if (stateRef.current.currentStrokes.length === 0 || stateRef.current.isMoving) return;
      
      const targets = stage.targets;
      if (!targets) return;

      stateRef.current.isMoving = true;
      const fabric = (window as any).fabric;

      // 글자 뭉치별 그룹화 (Cluster logic)
      const groups = groupStrokes(stateRef.current.currentStrokes);
      const availableIdx = stateRef.current.filledSlots.map((f, i) => f ? -1 : i).filter(v => v !== -1);

      if (availableIdx.length === 0) {
        stateRef.current.currentStrokes.forEach(s => fCanvas.remove(s));
        stateRef.current.currentStrokes = [];
        stateRef.current.isMoving = false;
        return;
      }

      const toMoveCount = Math.min(groups.length, availableIdx.length);
      const movePromises = [];

      for (let i = 0; i < toMoveCount; i++) {
        const targetIdx = availableIdx[i];
        const target = targets[targetIdx];
        stateRef.current.filledSlots[targetIdx] = true;

        const strokeGroup = groups[i];
        const fGroup = new fabric.Group(strokeGroup, { originX: 'center', originY: 'center', selectable: false });
        strokeGroup.forEach((s: any) => fCanvas.remove(s));
        fCanvas.add(fGroup);

        const br = fGroup.getBoundingRect();
        const scaleF = Math.min(target.width * 0.85 / br.width, target.height * 0.85 / br.height, 2);

        movePromises.push(new Promise<void>(resolve => {
          fGroup.animate({
            left: target.x + target.width / 2,
            top: target.y + target.height / 2,
            scaleX: scaleF, scaleY: scaleF
          }, {
            duration: 800, easing: fabric.util.ease.easeInOutQuart,
            onChange: fCanvas.renderAll.bind(fCanvas),
            onComplete: () => resolve()
          });
        }));
      }

      Promise.all(movePromises).then(() => {
        stateRef.current.currentStrokes = [];
        stateRef.current.isMoving = false;
      });
    };

    const groupStrokes = (strokes: any[]) => {
      const sorted = strokes.map(s => ({ o: s, l: s.getBoundingRect().left, r: s.getBoundingRect().left + s.getBoundingRect().width }))
                           .sort((a, b) => a.l - b.l);
      if (sorted.length === 0) return [];
      const result = [];
      let current = [sorted[0]];
      for (let i = 1; i < sorted.length; i++) {
        const maxR = Math.max(...current.map(x => x.r));
        if (sorted[i].l > maxR + CLUSTER_GAP) {
          result.push(current.map(x => x.o));
          current = [sorted[i]];
        } else {
          current.push(sorted[i]);
        }
      }
      result.push(current.map(x => x.o));
      return result;
    };

    fCanvas.on('path:created', onPathCreated);
    return () => fCanvas.off('path:created', onPathCreated);
  }, [fCanvas, stage]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-slate-100 overflow-hidden">
      {/* 뷰포트 컨테이너: 고정 해상도를 유지하며 스케일링 */}
      <div 
        ref={containerRef}
        className="relative bg-white shadow-2xl rounded-[32px] overflow-hidden"
        style={{ 
          width: MASTER_WIDTH, 
          height: MASTER_HEIGHT, 
          transform: `scale(${scale})`,
          transformOrigin: 'center center'
        }}
      >
        <canvas ref={canvasRef} />

        {/* 상단 네비게이션 UI */}
        <div className="absolute top-10 left-0 right-0 flex justify-center items-center gap-8 pointer-events-none">
          <button 
            onClick={onPrev}
            disabled={isFirst}
            className="pointer-events-auto w-12 h-12 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow-lg border border-slate-200 disabled:opacity-30 hover:bg-indigo-600 hover:text-white transition-all"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          
          <div className="bg-white/90 backdrop-blur px-8 py-3 rounded-full shadow-lg border border-indigo-100">
            <span className="text-indigo-600 font-black tracking-widest text-sm uppercase">STAGE {stageInfo}</span>
          </div>

          <button 
            onClick={onNext}
            disabled={isLast}
            className="pointer-events-auto w-12 h-12 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow-lg border border-slate-200 disabled:opacity-30 hover:bg-indigo-600 hover:text-white transition-all"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>

        {/* 하단 액션 UI */}
        <div className="absolute bottom-10 right-10 flex gap-4">
          <button 
            onClick={() => { fCanvas.clear(); fCanvas.backgroundColor='#ffffff'; renderWritingStage(); }}
            className="h-14 px-8 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
          >
            초기화
          </button>
          <button 
            onClick={onNext}
            className="h-14 px-10 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
          >
            입력 완료
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityCanvas;
