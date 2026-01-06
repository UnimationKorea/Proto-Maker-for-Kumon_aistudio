
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
  
  // 스케일 관련 상태
  const [autoScale, setAutoScale] = useState(1);
  const [userZoom, setUserZoom] = useState(1.0); // 100% 기본값
  
  // 가변 설정 상태값
  const [expansionFactor, setExpansionFactor] = useState(1.2);
  const [pinyinSize, setPinyinSize] = useState(32);
  const [hanjaSize, setHanjaSize] = useState(100);
  const [contentScale, setContentScale] = useState(1.0);

  const stateRef = useRef({
    currentStrokes: [] as any[],
    idleTimer: null as any,
    isMoving: false,
    filledSlots: [] as boolean[],
    dropTargets: [] as any[],
    activeZoneRect: null as any,
    activeSlotIdx: 0
  });

  // 1. 오토 스케일링 엔진 (화면 가득 채우도록 여백 최소화)
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current?.parentElement) return;
      const parent = containerRef.current.parentElement;
      
      // 여백을 최소화(20px)하여 상단까지 최대한 올라가도록 함
      const padding = 20; 
      const s = Math.min(
        (parent.clientWidth - padding) / MASTER_WIDTH,
        (parent.clientHeight - padding) / MASTER_HEIGHT
      );
      
      setAutoScale(s > 0 ? s : 0.8);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current?.parentElement) {
      resizeObserver.observe(containerRef.current.parentElement);
    }
    handleResize();
    return () => resizeObserver.disconnect();
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

    if (stage.inputType === 'drag') {
      fCanvas.isDrawingMode = false;
      renderDragStage();
    } else {
      fCanvas.isDrawingMode = true;
      renderWritingStage();
      if (stage.id === 3 || stage.inputType === 'direct') {
        updateActiveZoneVisual();
      }
    }

    fCanvas.renderAll();
  }, [fCanvas, stage, pinyinSize, hanjaSize, contentScale, expansionFactor]);

  // 콘텐츠 수직 중앙 보정을 위한 헬퍼 함수
  const getVerticalCenterOffset = () => {
    // 기본 데이터의 y값이 400 근처인 것을 감안하여 캔버스 중앙(512)으로 보정
    // stage.sentence.y가 400이면 512 - 400 = 112 만큼 아래로 내려야 완전 중앙임
    return 112; 
  };

  const renderWritingStage = () => {
    const fabric = (window as any).fabric;
    if (!stage.sentence || !stage.targets) return;

    const vOffset = getVerticalCenterOffset();
    const targetY = stage.targets[0].y + vOffset;
    const targetH = stage.targets[0].height;
    const centerY = targetY + targetH / 2 + 5;

    // 왼쪽 텍스트
    fCanvas.add(new fabric.Text(stage.sentence.pre, {
      left: stage.targets[0].x - 45, 
      top: centerY,
      fontSize: 60, 
      fontWeight: 800, 
      fill: '#1e293b', 
      originX: 'right', 
      originY: 'center', 
      selectable: false
    }));

    // 타겟 박스들
    stage.targets.forEach((t) => {
      fCanvas.add(new fabric.Rect({
        left: t.x, 
        top: t.y + vOffset, 
        width: t.width, 
        height: t.height,
        fill: 'rgba(79, 70, 229, 0.02)', 
        stroke: '#e2e8f0', 
        strokeWidth: 2, 
        rx: 16, 
        ry: 16, 
        selectable: false
      }));
    });

    // 오른쪽 텍스트
    const lastT = stage.targets[stage.targets.length - 1];
    fCanvas.add(new fabric.Text(stage.sentence.post, {
      left: lastT.x + lastT.width + 45, 
      top: centerY,
      fontSize: 60, 
      fontWeight: 800, 
      fill: '#1e293b', 
      originX: 'left', 
      originY: 'center', 
      selectable: false
    }));

    // 입력 패드 (inputType이 pad일 때만 하단에 배치)
    if (stage.inputType === 'pad') {
      fCanvas.add(new fabric.Rect({
        left: MASTER_WIDTH / 2, 
        top: 810, 
        width: 800, 
        height: 260,
        fill: '#f8fafc', 
        stroke: '#e2e8f0', 
        strokeWidth: 1.5, 
        rx: 24, 
        ry: 24, 
        originX: 'center',
        selectable: false, 
        evented: false
      }));
    }
  };

  const updateActiveZoneVisual = () => {
    const fabric = (window as any).fabric;
    const targets = stage.targets;
    if (!targets || stateRef.current.activeSlotIdx >= targets.length) return;
    
    if (stateRef.current.activeZoneRect) fCanvas.remove(stateRef.current.activeZoneRect);

    const vOffset = getVerticalCenterOffset();
    const t = targets[stateRef.current.activeSlotIdx];
    const w = t.width * expansionFactor;
    const h = t.height * expansionFactor;

    stateRef.current.activeZoneRect = new fabric.Rect({
      left: t.x - (w - t.width) / 2,
      top: (t.y + vOffset) - (h - t.height) / 2,
      width: w, height: h,
      fill: 'rgba(79, 70, 229, 0.05)', stroke: '#4f46e5', strokeWidth: 2, strokeDashArray: [8, 4], rx: 20, ry: 20,
      selectable: false, evented: false
    });
    fCanvas.add(stateRef.current.activeZoneRect);
    stateRef.current.activeZoneRect.sendToBack();
  };

  const renderDragStage = () => {
    const fabric = (window as any).fabric;
    const centerX = MASTER_WIDTH / 2;
    const cs = contentScale;

    // 전체 콘텐츠 중앙 정렬을 위한 래퍼(개념상) 카드
    const cardW = 940 * cs;
    const cardH = 480 * cs;
    fCanvas.add(new fabric.Rect({
      left: centerX, top: MASTER_HEIGHT / 2 + 50, width: cardW, height: cardH,
      fill: '#ffffff', stroke: '#e2e8f0', strokeWidth: 2, rx: 32 * cs, ry: 32 * cs, originX: 'center', originY: 'center', selectable: false, shadow: '0 10px 30px rgba(0,0,0,0.05)'
    }));

    if (stage.tokens) {
      const gap = 170 * cs;
      const startX = centerX - (stage.tokens.length - 1) * gap / 2;
      stage.tokens.forEach((token, i) => {
        const x = startX + i * gap;
        const y = MASTER_HEIGHT / 2 + 50;
        fCanvas.add(new fabric.Text(token.char, {
          left: x, top: y + (40 * cs), fontSize: hanjaSize * cs, fontWeight: 700, fill: '#1e293b', originX: 'center', selectable: false
        }));

        if (token.fixed) {
          fCanvas.add(new fabric.Text(token.pinyin, {
            left: x, top: y - (20 * cs), fontSize: pinyinSize * cs, fontWeight: 700, fill: '#4f46e5', originX: 'center', originY: 'center', selectable: false
          }));
        } else {
          const slot = new fabric.Rect({
            left: x, top: y - (20 * cs), width: 130 * cs, height: 80 * cs,
            fill: 'rgba(79, 70, 229, 0.03)', stroke: '#4f46e5', strokeWidth: 2, strokeDashArray: [6, 4], rx: 12 * cs, ry: 12 * cs, originX: 'center', originY: 'center', selectable: false
          });
          fCanvas.add(slot);
          stateRef.current.dropTargets.push({ x, y: y - (20 * cs), slot });
        }
      });
    }

    // 소스바 (상단)
    fCanvas.add(new fabric.Rect({
      left: centerX, top: 180, width: 1000 * cs, height: 110 * cs, fill: '#f1f5f9', rx: 20 * cs, ry: 20 * cs, originX: 'center', originY: 'center', selectable: false
    }));

    if (stage.sourceItems) {
      const gap = 200 * cs;
      const startX = centerX - (stage.sourceItems.length - 1) * gap / 2;
      stage.sourceItems.forEach((item, i) => {
        const group = new fabric.Group([
          new fabric.Rect({ width: 130 * cs, height: 75 * cs, fill: '#ffffff', stroke: '#e2e8f0', rx: 12 * cs, ry: 12 * cs, originX: 'center', originY: 'center', shadow: '0 4px 10px rgba(0,0,0,0.08)' }),
          new fabric.Text(item, { fontSize: pinyinSize * 0.8 * cs, fontWeight: 700, fill: '#1e293b', originX: 'center', originY: 'center' })
        ], {
          left: startX + i * gap, top: 180, originX: 'center', originY: 'center', hasControls: false, hasBorders: false, hoverCursor: 'pointer'
        });
        group.originalPos = { x: group.left, y: group.top };
        fCanvas.add(group);

        group.on('mouseup', () => {
          let snapped = false;
          for (const target of stateRef.current.dropTargets) {
            if (Math.abs(group.left - target.x) < 70 * cs && Math.abs(group.top - target.y) < 70 * cs) {
              group.animate({ left: target.x, top: target.y }, {
                duration: 150, onChange: fCanvas.renderAll.bind(fCanvas),
                onComplete: () => {
                  target.slot.set({ strokeWidth: 0, fill: 'transparent' });
                  group.item(0).set({ fill: 'transparent', strokeWidth: 0 });
                  group.item(1).set({ fill: '#4f46e5', fontSize: pinyinSize * cs });
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

  useEffect(() => {
    if (!fCanvas) return;
    const onPathCreated = (e: any) => {
      if (stateRef.current.isMoving) { fCanvas.remove(e.path); return; }
      stateRef.current.currentStrokes.push(e.path);
      clearTimeout(stateRef.current.idleTimer);
      stateRef.current.idleTimer = setTimeout(() => performPlacement(), IDLE_TIMEOUT);
    };

    const performPlacement = () => {
      if (stateRef.current.currentStrokes.length === 0 || stateRef.current.isMoving) return;
      const targets = stage.targets;
      if (!targets) return;
      stateRef.current.isMoving = true;
      const fabric = (window as any).fabric;
      const vOffset = getVerticalCenterOffset();
      
      const sorted = stateRef.current.currentStrokes.map(s => ({ o: s, l: s.getBoundingRect().left, r: s.getBoundingRect().left + s.getBoundingRect().width })).sort((a, b) => a.l - b.l);
      const groups: any[] = [];
      let current = [sorted[0]];
      for (let i = 1; i < sorted.length; i++) {
        const maxR = Math.max(...current.map(x => x.r));
        if (sorted[i].l > maxR + CLUSTER_GAP) { groups.push(current.map(x => x.o)); current = [sorted[i]]; }
        else { current.push(sorted[i]); }
      }
      groups.push(current.map(x => x.o));

      const availableIdx = stateRef.current.filledSlots.map((f, i) => f ? -1 : i).filter(v => v !== -1);
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
          fGroup.animate({ left: target.x + target.width / 2, top: (target.y + vOffset) + target.height / 2, scaleX: scaleF, scaleY: scaleF }, {
            duration: 800, easing: fabric.util.ease.easeInOutQuart, onChange: fCanvas.renderAll.bind(fCanvas),
            onComplete: () => {
              if (stage.inputType === 'direct') {
                stateRef.current.activeSlotIdx++;
                updateActiveZoneVisual();
              }
              resolve();
            }
          });
        }));
      }
      Promise.all(movePromises).then(() => { stateRef.current.currentStrokes = []; stateRef.current.isMoving = false; });
    };

    fCanvas.on('path:created', onPathCreated);
    return () => fCanvas.off('path:created', onPathCreated);
  }, [fCanvas, stage, expansionFactor]);

  const finalScale = autoScale * userZoom;

  return (
    <div className="relative w-full h-full flex items-start justify-center bg-slate-100 overflow-hidden pt-4">
      {/* 화면 스케일 조절 버튼 (우측 상단) */}
      <div className="absolute top-6 right-6 z-[60] flex flex-col gap-2">
        <div className="bg-white/90 backdrop-blur border border-slate-200 p-3 rounded-2xl shadow-xl flex flex-col items-center gap-3">
          <button 
            onClick={() => setUserZoom(prev => Math.min(prev + 0.05, 1.5))}
            className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 transition-all font-black text-xl"
          >
            +
          </button>
          <div className="text-[10px] font-black text-indigo-600 tracking-tighter">
            {Math.round(userZoom * 100)}%
          </div>
          <button 
            onClick={() => setUserZoom(prev => Math.max(prev - 0.05, 0.4))}
            className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 transition-all font-black text-xl"
          >
            -
          </button>
        </div>
        <p className="text-[9px] font-bold text-slate-400 text-center uppercase tracking-widest">Display Zoom</p>
      </div>

      {/* 학습 콘텐츠 영역 - 상단 정렬(items-start)을 위해 transformOrigin 수정 */}
      <div 
        ref={containerRef}
        className="relative bg-white shadow-2xl rounded-[40px] overflow-hidden"
        style={{ 
          width: MASTER_WIDTH, 
          height: MASTER_HEIGHT, 
          transform: `scale(${finalScale})`, 
          transformOrigin: 'top center' 
        }}
      >
        <canvas ref={canvasRef} />

        {/* 상단 네비게이션 */}
        <div className="absolute top-10 left-0 right-0 flex justify-center items-center gap-8 pointer-events-none">
          <button onClick={onPrev} disabled={isFirst} className="pointer-events-auto w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg border border-slate-200 disabled:opacity-20 hover:bg-indigo-600 hover:text-white transition-all">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <div className="bg-white/90 backdrop-blur px-8 py-3 rounded-full shadow-lg border border-indigo-100">
            <span className="text-indigo-600 font-black tracking-widest text-sm uppercase">STAGE {stageInfo}</span>
          </div>
          <button onClick={onNext} disabled={isLast} className="pointer-events-auto w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg border border-slate-200 disabled:opacity-20 hover:bg-indigo-600 hover:text-white transition-all">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>

        {/* 좌측 하단 컨트롤러 */}
        <div className="absolute bottom-10 left-10 flex flex-col gap-4 pointer-events-auto">
          {(stage.id === 3 || stage.inputType === 'direct') && (
            <div className="bg-white/95 backdrop-blur-xl p-6 rounded-3xl shadow-xl border border-slate-100 flex flex-col gap-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">입력 감도 조절</label>
              <div className="flex items-center gap-4">
                <input type="range" min="1.0" max="1.8" step="0.1" value={expansionFactor} onChange={(e) => setExpansionFactor(parseFloat(e.target.value))} className="w-40 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                <span className="text-sm font-bold text-indigo-600 w-10">{Math.round(expansionFactor * 100)}%</span>
              </div>
            </div>
          )}

          {(stage.id === 10 || stage.inputType === 'drag') && (
            <div className="bg-white/95 backdrop-blur-xl p-6 rounded-3xl shadow-xl border border-slate-100 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">병음 크기</label>
                <div className="flex items-center gap-4">
                  <input type="range" min="20" max="60" value={pinyinSize} onChange={(e) => setPinyinSize(parseInt(e.target.value))} className="w-40 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                  <span className="text-xs font-bold text-slate-700 w-6">{pinyinSize}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">한자 크기</label>
                <div className="flex items-center gap-4">
                  <input type="range" min="60" max="150" value={hanjaSize} onChange={(e) => setHanjaSize(parseInt(e.target.value))} className="w-40 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                  <span className="text-xs font-bold text-slate-700 w-6">{hanjaSize}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">콘텐츠 내부 배율</label>
                <div className="flex items-center gap-4">
                  <input type="range" min="0.5" max="1.2" step="0.05" value={contentScale} onChange={(e) => setContentScale(parseFloat(e.target.value))} className="w-40 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                  <span className="text-xs font-bold text-indigo-600 w-10">{Math.round(contentScale * 100)}%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 우측 하단 액션 버튼 */}
        <div className="absolute bottom-10 right-10 flex gap-4">
          <button onClick={() => { fCanvas.clear(); fCanvas.backgroundColor='#ffffff'; renderWritingStage(); if(stage.inputType === 'drag') renderDragStage(); }} className="h-14 px-8 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all">초기화</button>
          <button onClick={onNext} className="h-14 px-10 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all">입력 완료</button>
        </div>
      </div>
    </div>
  );
};

export default ActivityCanvas;
