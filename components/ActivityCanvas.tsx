
import React, { useEffect, useRef, useState } from 'react';
import { ActivityStage } from '../types';

interface ActivityCanvasProps {
  stage: ActivityStage;
  onNext: () => void;
  onPrev: () => void;
  isFirst: boolean;
  isLast: boolean;
  stageInfo: string;
}

const MASTER_WIDTH = 1280;
const MASTER_HEIGHT = 720; 
const IDLE_TIMEOUT = 1200;
const CLUSTER_GAP = 50;

const ActivityCanvas: React.FC<ActivityCanvasProps> = ({ stage, onNext, onPrev, isFirst, isLast, stageInfo }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fCanvas, setFCanvas] = useState<any>(null);
  
  const [autoScale, setAutoScale] = useState(1);
  const [userZoom, setUserZoom] = useState(1.0); 
  
  const [expansionFactor, setExpansionFactor] = useState(1.3);
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

  // 1. 오토 스케일링: 가로폭에 최대한 맞추되, 상단 내비와 하단 바 사이 공간 최적화
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current?.parentElement) return;
      const parent = containerRef.current.parentElement;
      
      const horizontalPadding = 40; 
      const verticalPadding = 220; // 상단 내비 + 하단 기능 바
      
      const availableWidth = parent.clientWidth - horizontalPadding;
      const availableHeight = parent.clientHeight - verticalPadding;
      
      const s = Math.min(
        availableWidth / MASTER_WIDTH,
        availableHeight / MASTER_HEIGHT
      );
      
      setAutoScale(s > 0 ? s : 0.6);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current?.parentElement) {
      resizeObserver.observe(containerRef.current.parentElement);
    }
    handleResize();
    return () => resizeObserver.disconnect();
  }, []);

  // 2. Fabric 초기화
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
    brush.color = '#1E293B';
    brush.width = 7; // 브러시 두께도 약간 조절
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
      if (stage.inputType === 'direct') {
        updateActiveZoneVisual();
      }
    }

    fCanvas.renderAll();
  }, [fCanvas, stage, pinyinSize, hanjaSize, contentScale, expansionFactor]);

  // 콘텐츠 수직 오프셋 (상단 밀착 유지를 위해 더 위로 올림)
  const getVerticalCenterOffset = () => -100;

  const renderWritingStage = () => {
    const fabric = (window as any).fabric;
    if (!stage.sentence || !stage.targets) return;

    const vOffset = getVerticalCenterOffset();
    const targetY = stage.targets[0].y + vOffset;
    const targetH = stage.targets[0].height;
    const centerY = targetY + targetH / 2;

    // 문제 텍스트 및 칸 80% 수준으로 축소 (기존 64 -> 50)
    const textStyle = {
      fontSize: 50, 
      fontWeight: 900, 
      fill: '#1E293B', 
      originY: 'center', 
      charSpacing: 25,
      selectable: false,
      fontFamily: 'Noto Sans KR'
    };

    fCanvas.add(new fabric.Text(stage.sentence.pre, {
      ...textStyle,
      left: stage.targets[0].x - 50, 
      top: centerY,
      originX: 'right'
    }));

    stage.targets.forEach((t) => {
      // 타겟 칸 크기도 약 80% 수준으로 렌더링
      const rectW = t.width * 0.8;
      const rectH = t.height * 0.8;
      const rectX = t.x + (t.width - rectW) / 2;
      const rectY = t.y + (t.height - rectH) / 2 + vOffset;

      fCanvas.add(new fabric.Rect({
        left: rectX, 
        top: rectY, 
        width: rectW, 
        height: rectH,
        fill: '#F8FAFC', 
        stroke: '#CBD5E1', 
        strokeWidth: 2, 
        rx: 12, 
        ry: 12, 
        selectable: false
      }));
    });

    const lastT = stage.targets[stage.targets.length - 1];
    fCanvas.add(new fabric.Text(stage.sentence.post, {
      ...textStyle,
      left: lastT.x + lastT.width + 50, 
      top: centerY,
      originX: 'left'
    }));

    // 패드 영역 (쓰기 안내 문구 포함)
    if (stage.inputType === 'pad') {
      fCanvas.add(new fabric.Rect({
        left: MASTER_WIDTH / 2, 
        top: 480, 
        width: 1040, 
        height: 320,
        fill: '#F8FAFC', 
        stroke: '#E2E8F0', 
        strokeWidth: 1.5, 
        rx: 32, 
        ry: 32, 
        originX: 'center',
        selectable: false, 
        evented: false
      }));
      fCanvas.add(new fabric.Text('여기에 써주세요', {
        left: MASTER_WIDTH / 2,
        top: 340,
        fontSize: 18,
        fill: '#94A3B8',
        originX: 'center',
        selectable: false
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
    // 타겟 칸 80% 축소 반영
    const rectW = t.width * 0.8;
    const rectH = t.height * 0.8;
    const rectX = t.x + (t.width - rectW) / 2;
    const rectY = t.y + (t.height - rectH) / 2 + vOffset;

    const w = rectW * expansionFactor;
    const h = rectH * expansionFactor;

    stateRef.current.activeZoneRect = new fabric.Rect({
      left: rectX - (w - rectW) / 2,
      top: rectY - (h - rectH) / 2,
      width: w, height: h,
      fill: 'rgba(79, 70, 229, 0.02)', stroke: '#6366F1', strokeWidth: 3, strokeDashArray: [8, 4], rx: 16, ry: 16,
      selectable: false, evented: false
    });
    fCanvas.add(stateRef.current.activeZoneRect);
    stateRef.current.activeZoneRect.sendToBack();
  };

  const renderDragStage = () => {
    const fabric = (window as any).fabric;
    const centerX = MASTER_WIDTH / 2;
    const centerY = MASTER_HEIGHT / 2;
    const cs = contentScale;

    const cardW = 900 * cs;
    const cardH = 380 * cs;
    fCanvas.add(new fabric.Rect({
      left: centerX, top: centerY - 20, width: cardW, height: cardH,
      fill: '#ffffff', stroke: '#F1F5F9', strokeWidth: 1, rx: 40 * cs, ry: 40 * cs, originX: 'center', originY: 'center', selectable: false, 
      shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.02)', blur: 30, offsetX: 0, offsetY: 15 })
    }));

    if (stage.tokens) {
      const gap = 160 * cs;
      const startX = centerX - (stage.tokens.length - 1) * gap / 2;
      stage.tokens.forEach((token, i) => {
        const x = startX + i * gap;
        const y = centerY - 20;
        
        fCanvas.add(new fabric.Text(token.char, {
          left: x, top: y + (30 * cs), fontSize: hanjaSize * 0.8 * cs, fontWeight: 800, fill: '#1E293B', originX: 'center', selectable: false
        }));

        if (token.fixed) {
          fCanvas.add(new fabric.Text(token.pinyin, {
            left: x, top: y - (40 * cs), fontSize: pinyinSize * 0.8 * cs, fontWeight: 700, fill: '#6366F1', originX: 'center', originY: 'center', selectable: false
          }));
        } else {
          const slot = new fabric.Rect({
            left: x, top: y - (40 * cs), width: 120 * cs, height: 70 * cs,
            fill: '#F8FAFC', stroke: '#6366F1', strokeWidth: 2, strokeDashArray: [6, 3], rx: 12 * cs, ry: 12 * cs, originX: 'center', originY: 'center', selectable: false
          });
          fCanvas.add(slot);
          stateRef.current.dropTargets.push({ x, y: y - (40 * cs), slot });
        }
      });
    }

    fCanvas.add(new fabric.Rect({
      left: centerX, top: 100, width: 900 * cs, height: 90 * cs, fill: '#F1F5F9', rx: 24 * cs, ry: 24 * cs, originX: 'center', originY: 'center', selectable: false
    }));

    if (stage.sourceItems) {
      const gap = 180 * cs;
      const startX = centerX - (stage.sourceItems.length - 1) * gap / 2;
      stage.sourceItems.forEach((item, i) => {
        const group = new fabric.Group([
          new fabric.Rect({ width: 140 * cs, height: 65 * cs, fill: '#ffffff', stroke: '#E2E8F0', rx: 12 * cs, ry: 12 * cs, originX: 'center', originY: 'center' }),
          new fabric.Text(item, { fontSize: pinyinSize * 0.8 * cs, fontWeight: 700, fill: '#1E293B', originX: 'center', originY: 'center' })
        ], {
          left: startX + i * gap, top: 100, originX: 'center', originY: 'center', hasControls: false, hasBorders: false, hoverCursor: 'pointer',
          shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.05)', blur: 8, offsetX: 0, offsetY: 3 })
        });
        group.originalPos = { x: group.left, y: group.top };
        fCanvas.add(group);

        group.on('mouseup', () => {
          let snapped = false;
          for (const target of stateRef.current.dropTargets) {
            if (Math.abs(group.left - target.x) < 70 * cs && Math.abs(group.top - target.y) < 70 * cs) {
              group.animate({ left: target.x, top: target.y }, {
                duration: 200, onChange: fCanvas.renderAll.bind(fCanvas),
                onComplete: () => {
                  target.slot.set({ strokeWidth: 0, fill: 'transparent' });
                  group.item(0).set({ fill: 'transparent', strokeWidth: 0 });
                  group.item(1).set({ fill: '#6366F1', fontSize: pinyinSize * 0.9 * cs });
                  fCanvas.renderAll();
                }
              });
              snapped = true;
              break;
            }
          }
          if (!snapped) {
            group.animate({ left: group.originalPos.x, top: group.originalPos.y }, { duration: 400, easing: fabric.util.ease.easeOutBack, onChange: fCanvas.renderAll.bind(fCanvas) });
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
        
        // 80% 축소 칸 크기에 맞춰 스케일 조정
        const rectW = target.width * 0.8;
        const rectH = target.height * 0.8;
        const rectCenterX = target.x + target.width / 2;
        const rectCenterY = target.y + target.height / 2 + vOffset;

        const scaleF = Math.min(rectW * 0.9 / br.width, rectH * 0.9 / br.height, 2.0);
        movePromises.push(new Promise<void>(resolve => {
          fGroup.animate({ left: rectCenterX, top: rectCenterY, scaleX: scaleF, scaleY: scaleF }, {
            duration: 900, easing: fabric.util.ease.easeInOutQuart, onChange: fCanvas.renderAll.bind(fCanvas),
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
    <div className="w-full h-full flex flex-col items-center justify-between p-2 relative overflow-hidden bg-slate-50/50">
      
      {/* 1. 스테이지 내비게이션 & 줌 컨트롤: 최상단 고정 */}
      <div className="w-full flex justify-center items-center gap-6 mt-6 z-[80] relative">
        <div className="flex items-center gap-3">
          <button 
            onClick={onPrev} 
            disabled={isFirst} 
            className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-md border border-slate-100 disabled:opacity-20 hover:bg-slate-50 transition-all text-slate-700"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          
          <div className="bg-white px-10 py-2.5 rounded-2xl shadow-xl border border-indigo-100 min-w-[160px] text-center">
            <span className="text-indigo-600 font-black tracking-[0.2em] text-xs uppercase">STAGE {stageInfo}</span>
          </div>
          
          <button 
            onClick={onNext} 
            disabled={isLast} 
            className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-md border border-slate-100 disabled:opacity-20 hover:bg-slate-50 transition-all text-slate-700"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>

        {/* 줌 컨트롤러: 이미지 가이드처럼 상단 라인 유지 */}
        <div className="absolute right-8 flex items-center gap-2">
          <div className="bg-white/95 backdrop-blur-xl border border-slate-200 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-3">
             <button onClick={() => setUserZoom(p => Math.max(p - 0.05, 0.4))} className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center hover:bg-indigo-50 font-black text-slate-600 transition-colors">-</button>
             <div className="text-[11px] font-black text-indigo-600 min-w-[36px] text-center">{Math.round(userZoom * 100)}%</div>
             <button onClick={() => setUserZoom(p => Math.min(p + 0.05, 1.5))} className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center hover:bg-indigo-50 font-black text-slate-600 transition-colors">+</button>
          </div>
        </div>
      </div>

      {/* 2. 학습 영역: 내비게이션 바로 밑 상단 밀착 배치 */}
      <div className="flex-1 w-full flex items-start justify-center pt-2">
        <div 
          ref={containerRef}
          className="relative bg-white shadow-2xl rounded-[40px] overflow-hidden border border-slate-200/60"
          style={{ 
            width: MASTER_WIDTH, 
            height: MASTER_HEIGHT, 
            transform: `scale(${finalScale})`, 
            transformOrigin: 'top center' 
          }}
        >
          <canvas ref={canvasRef} />
        </div>
      </div>

      {/* 3. 하단 기능 바: scale 조정, refresh, confirm 버튼 복구 */}
      <div className="w-full max-w-7xl flex items-end justify-between px-10 pb-12 z-[80]">
        
        {/* 좌측: scale 조정 (가이드) */}
        <div className="flex gap-4">
          <div className="bg-white/95 backdrop-blur-xl p-5 rounded-2xl shadow-2xl border border-white flex flex-col gap-3 min-w-[280px]">
            <div className="flex justify-between items-center px-1">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">scale 조정 가이드</label>
              <span className="text-xs font-black text-indigo-600">감도: {Math.round(expansionFactor * 100)}%</span>
            </div>
            <input 
              type="range" min="1.0" max="2.0" step="0.1" 
              value={expansionFactor} 
              onChange={(e) => setExpansionFactor(parseFloat(e.target.value))} 
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none accent-indigo-600 cursor-pointer" 
            />
            {/* 드래그 앤 드롭 전용 스케일 컨트롤 (스테이지 4용) */}
            {stage.inputType === 'drag' && (
              <div className="mt-2 pt-2 border-t border-slate-50 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-slate-400 font-black uppercase">Pinyin</span>
                    <input type="range" min="16" max="64" value={pinyinSize} onChange={(e) => setPinyinSize(parseInt(e.target.value))} className="h-1 bg-slate-100 rounded-lg appearance-none accent-indigo-600" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-slate-400 font-black uppercase">Hanja</span>
                    <input type="range" min="40" max="180" value={hanjaSize} onChange={(e) => setHanjaSize(parseInt(e.target.value))} className="h-1 bg-slate-100 rounded-lg appearance-none accent-indigo-600" />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase">
                    <span>콘텐츠 배율</span>
                    <span className="text-indigo-600">{Math.round(contentScale * 100)}%</span>
                  </div>
                  <input type="range" min="0.5" max="1.5" step="0.05" value={contentScale} onChange={(e) => setContentScale(parseFloat(e.target.value))} className="w-full h-1 bg-slate-100 rounded-lg appearance-none accent-slate-400" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 우측: refresh & confirm */}
        <div className="flex gap-4">
          <button 
            onClick={() => { fCanvas.clear(); fCanvas.backgroundColor='#ffffff'; renderWritingStage(); if(stage.inputType === 'drag') renderDragStage(); }} 
            className="h-14 px-8 bg-white border border-slate-200 rounded-2xl font-black text-slate-500 shadow-xl hover:bg-slate-50 transition-all active:scale-95 flex items-center gap-3"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><path d="M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" /></svg>
            <span className="text-base tracking-tight">refresh</span>
          </button>
          
          <button 
            onClick={onNext} 
            className="h-14 px-10 bg-indigo-600 text-white rounded-2xl font-black shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-3"
          >
            <span className="text-base tracking-tight">confirm</span>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>
      </div>

    </div>
  );
};

export default ActivityCanvas;
