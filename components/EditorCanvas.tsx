
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Lens, StyleState } from '../types';
import { hexToRgba } from '../utils/colorUtils';
import { Minus, Plus, MousePointer2, Hand, Maximize, Ban, Command, MoveVertical, CopyPlus } from 'lucide-react';
import { Theme } from '../App';

interface EditorCanvasProps {
  imageSrc: string;
  lenses: Lens[];
  setLenses: React.Dispatch<React.SetStateAction<Lens[]>>;
  style: StyleState;
  setStyle: React.Dispatch<React.SetStateAction<StyleState>>;
  onImageDimensionsChange: (dims: { width: number, height: number }) => void;
  theme: Theme;
}

const MIN_VIEW_SCALE = 0.05;

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
  imageSrc, lenses, setLenses, style, setStyle, onImageDimensionsChange, theme
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);

  const [viewScale, setViewScale] = useState(0.8);
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isSpaceHeld, setIsSpaceHeld] = useState(false);
  const [isAltHeld, setIsAltHeld] = useState(false);
  
  // Track which lens is being dragged
  const [draggingLensId, setDraggingLensId] = useState<string | null>(null);
  const [hoveringLensId, setHoveringLensId] = useState<string | null>(null);
  
  // Track if user has used lens shortcuts to hide helpers
  const [hasInteracted, setHasInteracted] = useState(false);
  
  const [imgDimensions, setImgDimensions] = useState({ width: 2000, height: 2000 });
  const [maxFitScale, setMaxFitScale] = useState(1.0);

  // Calculated crop dimensions in original image pixels
  const cropW_img = imgDimensions.width * (style.cropWidth / 100);
  const cropH_img = imgDimensions.height * (style.cropHeight / 100);

  const updateMaxScale = useCallback(() => {
      if (!workspaceRef.current || cropW_img <= 0 || cropH_img <= 0) return;
      const { width: wsW, height: wsH } = workspaceRef.current.getBoundingClientRect();
      const padding = 64; // Comfortable padding around the canvas
      const availableWidth = Math.max(100, wsW - padding);
      const availableHeight = Math.max(100, wsH - padding);

      const scaleX = availableWidth / cropW_img;
      const scaleY = availableHeight / cropH_img;
      
      const fitScale = Math.min(scaleX, scaleY);
      const newMax = Math.min(1.0, fitScale);
      
      setMaxFitScale(newMax);
      setViewScale(prev => Math.min(prev, newMax));
  }, [cropW_img, cropH_img]);

  useEffect(() => {
      updateMaxScale();
      const ro = new ResizeObserver(updateMaxScale);
      if (workspaceRef.current) ro.observe(workspaceRef.current);
      return () => ro.disconnect();
  }, [updateMaxScale]);

  const fitToScreen = useCallback(() => {
      setViewScale(Math.max(MIN_VIEW_SCALE, maxFitScale));
      setViewOffset({ x: 0, y: 0 });
  }, [maxFitScale]);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const naturalWidth = img.naturalWidth || img.width;
    const naturalHeight = img.naturalHeight || img.height;
    setImgDimensions({ width: naturalWidth, height: naturalHeight });
    onImageDimensionsChange({ width: naturalWidth, height: naturalHeight });
    setLenses(prev => prev.map((l, i) => i === 0 && l.size === 250 ? { ...l, size: Math.round(naturalWidth / 3) } : l));
    setTimeout(fitToScreen, 0);
  };

  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.code === 'Space' && !e.repeat && (e.target as HTMLElement).tagName !== 'INPUT') {
             setIsSpaceHeld(true);
          }
          if (e.key === 'Alt') setIsAltHeld(true);
      };
      const handleKeyUp = (e: KeyboardEvent) => { 
          if (e.code === 'Space') setIsSpaceHeld(false); 
          if (e.key === 'Alt') setIsAltHeld(false);
      };
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      return () => {
          window.removeEventListener('keydown', handleKeyDown);
          window.removeEventListener('keyup', handleKeyUp);
      };
  }, []);

  useEffect(() => {
      const workspaceEl = workspaceRef.current;
      if (!workspaceEl) return;

      const handleWheel = (e: WheelEvent) => {
          const target = e.target as HTMLElement;
          const lensEl = target.closest('[data-lens-id]');
          
          if (lensEl && !isSpaceHeld) {
              e.preventDefault();
              e.stopPropagation();
              setHasInteracted(true);
              const lensId = (lensEl as HTMLElement).getAttribute('data-lens-id');
              if (!lensId) return;

              const delta = -e.deltaY;

              setLenses(prevLenses => prevLenses.map(l => {
                  if (l.id !== lensId) return l;

                  if (e.metaKey || e.ctrlKey) {
                      return { ...l, zoom: Math.min(Math.max(l.zoom + (delta * 0.002), 1.5), 8) };
                  } else {
                      return { ...l, size: Math.min(Math.max(Math.round(l.size + (delta * 1.5)), 50), Math.max(50, imgDimensions.width)) };
                  }
              }));
          } else {
              const delta = -e.deltaY * 0.001;
              setViewScale(prev => Math.min(Math.max(MIN_VIEW_SCALE, prev + delta), maxFitScale));
          }
      };

      workspaceEl.addEventListener('wheel', handleWheel, { passive: false });
      return () => workspaceEl.removeEventListener('wheel', handleWheel);
  }, [setLenses, imgDimensions.width, isSpaceHeld, maxFitScale]);

  const updateLensPosition = useCallback((clientX: number, clientY: number, lensId: string) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    
    setLenses(prev => prev.map(l => l.id === lensId ? { ...l, x, y } : l));
  }, [setLenses]);

  const handleMouseDown = (e: React.MouseEvent) => {
      if (e.button === 1 || isSpaceHeld) {
          e.preventDefault();
          setIsPanning(true);
      }
  };

  const handleLensMouseDown = (e: React.MouseEvent, lensId: string) => {
      if (e.button !== 0 || isSpaceHeld) return;
      e.stopPropagation();
      e.preventDefault();

      if (e.altKey) {
          setHasInteracted(true);
          const lensToDuplicate = lenses.find(l => l.id === lensId);
          if (lensToDuplicate) {
              const newLens: Lens = { ...lensToDuplicate, id: crypto.randomUUID() };
              setLenses(prev => [...prev, newLens]);
              setDraggingLensId(newLens.id);
              updateLensPosition(e.clientX, e.clientY, newLens.id);
          }
      } else {
          setDraggingLensId(lensId);
          updateLensPosition(e.clientX, e.clientY, lensId);
      }
  };

  useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
          if (draggingLensId) {
              updateLensPosition(e.clientX, e.clientY, draggingLensId);
          } else if (isPanning) {
              setViewOffset(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
          }
      };
      const handleMouseUp = () => {
          setDraggingLensId(null);
          setIsPanning(false);
      };
      if (draggingLensId || isPanning) {
          window.addEventListener('mousemove', handleMouseMove);
          window.addEventListener('mouseup', handleMouseUp);
      }
      return () => {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
      };
  }, [draggingLensId, isPanning, updateLensPosition]);

  const renderedWidth = cropW_img * viewScale;
  const renderedHeight = cropH_img * viewScale;

  const isTransparent = style.isBackgroundTransparent;
  const bgColor = style.backgroundColor;

  const checkerColor1 = theme === 'dark' ? '#1a1a1a' : '#f4f4f5';
  const checkerColor2 = 'transparent';
  const checkerGradient = `linear-gradient(45deg, ${checkerColor1} 25%, ${checkerColor2} 25%), linear-gradient(-45deg, ${checkerColor1} 25%, ${checkerColor2} 25%), linear-gradient(45deg, ${checkerColor2} 75%, ${checkerColor1} 75%), linear-gradient(-45deg, ${checkerColor2} 75%, ${checkerColor1} 75%)`;

  // Updated box-shadow to include spread
  const containerBoxShadow = style.canvasShadowEnabled
      ? `${style.canvasShadowX * viewScale}px ${style.canvasShadowY * viewScale}px ${style.canvasShadowBlur * viewScale}px ${style.canvasShadowSpread * viewScale}px ${hexToRgba(style.canvasShadowColor, style.canvasShadowOpacity)}`
      : '0 25px 50px -12px rgb(0 0 0 / 0.25)';

  const commonBgStyle: React.CSSProperties = {
      backgroundColor: isTransparent ? 'transparent' : bgColor,
      backgroundImage: isTransparent ? checkerGradient : 'none',
      backgroundSize: '24px 24px',
      backgroundPosition: '0 0, 0 12px, 12px -12px, -12px 0px',
  };

  const imgW_view = imgDimensions.width * style.cropZoom * viewScale;
  const imgH_view = imgDimensions.height * style.cropZoom * viewScale;
  const imgLeft_view = (renderedWidth - imgW_view) * (style.cropX / 100);
  const imgTop_view = (renderedHeight - imgH_view) * (style.cropY / 100);

  const baseImageStyle: React.CSSProperties = {
      width: `${imgW_view}px`,
      height: `${imgH_view}px`,
      maxWidth: 'none',
      position: 'absolute',
      left: `${imgLeft_view}px`,
      top: `${imgTop_view}px`,
      filter: `blur(${style.baseBlur}px) grayscale(${style.baseGrayscale}%)`,
      opacity: style.baseOpacity / 100,
  };
  
  const scrimStyle: React.CSSProperties = {
      backgroundColor: style.scrimColor,
      opacity: style.scrimOpacity / 100,
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-zinc-100 dark:bg-zinc-950 flex flex-col transition-colors duration-200">
      <div
          ref={workspaceRef}
          className={`flex-1 relative overflow-hidden ${isSpaceHeld ? 'cursor-grab active:cursor-grabbing' : ''}`}
          onMouseDown={handleMouseDown}
          style={{
               backgroundColor: isTransparent ? 'transparent' : bgColor,
               backgroundImage: isTransparent ? checkerGradient : 'none',
               backgroundSize: '24px 24px', backgroundPosition: '0 0, 0 12px, 12px -12px, -12px 0px'
          }}
      >
          <div
              style={{
                  transform: `translate(${viewOffset.x}px, ${viewOffset.y}px)`,
                  transition: isPanning ? 'none' : 'transform 0.1s ease-out',
                  width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none'
              }}
          >
              <div
                  ref={containerRef}
                  style={{
                      width: renderedWidth, height: renderedHeight,
                      borderRadius: `${style.cropRadius * viewScale}px`,
                      pointerEvents: 'auto', position: 'relative',
                      boxShadow: containerBoxShadow,
                      ...commonBgStyle
                  }}
                  className="flex-shrink-0 transition-shadow"
              >
                  <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: `${style.cropRadius * viewScale}px` }}>
                      <img ref={imageRef} src={imageSrc} alt="Workspace" className="block object-contain pointer-events-none select-none relative z-0" style={baseImageStyle} onLoad={onImageLoad} draggable={false} />
                      <div className="absolute inset-0 pointer-events-none z-[1]" style={scrimStyle} />
                  </div>

                  {style.canvasBorderWidth > 0 && (
                      <div
                          className="absolute inset-0 pointer-events-none z-[2]"
                          style={{
                              borderRadius: `${style.cropRadius * viewScale}px`,
                              borderWidth: `${style.canvasBorderWidth * viewScale}px`,
                              borderColor: style.canvasBorderColor,
                              borderStyle: 'solid',
                              boxSizing: 'border-box',
                          }}
                      />
                  )}

                  {lenses.map(lens => {
                      const displayLensSize = lens.size * viewScale;
                      const displayBorderWidth = lens.borderWidth * viewScale;
                      const zoomedImgW = imgDimensions.width * lens.zoom;
                      const zoomedImgH = imgDimensions.height * lens.zoom;
                      const displayZoomedW = zoomedImgW * viewScale;
                      const displayZoomedH = zoomedImgH * viewScale;

                      const lensCenterX_crop = lens.x * cropW_img;
                      const lensCenterY_crop = lens.y * cropH_img;
                      
                      const imgOffsetX_in_crop = (cropW_img - (imgDimensions.width * style.cropZoom)) * (style.cropX / 100);
                      const imgOffsetY_in_crop = (cropH_img - (imgDimensions.height * style.cropZoom)) * (style.cropY / 100);

                      const lensCenterX_rel_img = lensCenterX_crop - imgOffsetX_in_crop;
                      const lensCenterY_rel_img = lensCenterY_crop - imgOffsetY_in_crop;

                      const lensOffsetX = (displayLensSize / 2) - (lensCenterX_rel_img / style.cropZoom * lens.zoom * viewScale);
                      const lensOffsetY = (displayLensSize / 2) - (lensCenterY_rel_img / style.cropZoom * lens.zoom * viewScale);

                      const isHoveringThis = hoveringLensId === lens.id;
                      const isDraggingThis = draggingLensId === lens.id;

                      // Updated lens box-shadow to include spread
                      return (
                          <div
                              key={lens.id}
                              data-lens-id={lens.id}
                              className={`absolute z-10 ${isAltHeld ? 'cursor-copy' : 'cursor-move'} ${isSpaceHeld ? 'pointer-events-none' : ''} group`}
                              style={{
                                  left: `${lens.x * 100}%`, top: `${lens.y * 100}%`,
                                  width: `${displayLensSize}px`, height: `${displayLensSize}px`,
                                  transform: 'translate(-50%, -50%)', borderRadius: '50%',
                                  boxShadow: `${lens.shadowX * viewScale}px ${lens.shadowY * viewScale}px ${lens.shadowBlur * viewScale}px ${lens.shadowSpread * viewScale}px ${hexToRgba(lens.shadowColor, lens.shadowOpacity)}`,
                              }}
                              onMouseDown={(e) => handleLensMouseDown(e, lens.id)}
                              onMouseEnter={() => setHoveringLensId(lens.id)}
                              onMouseLeave={() => setHoveringLensId(null)}
                          >
                              <div className="absolute inset-0 overflow-hidden rounded-full" style={commonBgStyle}>
                                  <img src={imageSrc} alt="Zoomed" style={{
                                      width: `${displayZoomedW}px`, height: `${displayZoomedH}px`,
                                      maxWidth: 'none', position: 'absolute',
                                      left: `${lensOffsetX}px`, top: `${lensOffsetY}px`,
                                      pointerEvents: 'none', borderRadius: `${style.cropRadius * viewScale * lens.zoom}px`,
                                  }} draggable={false} />
                              </div>
                              <div className="absolute inset-0 rounded-full pointer-events-none" style={{ border: `${displayBorderWidth}px solid ${lens.borderColor}` }} />
                              
                              <div className={`absolute inset-0 rounded-full flex items-center justify-center transition-opacity duration-200 pointer-events-none ${isHoveringThis && !isDraggingThis && !isSpaceHeld && !hasInteracted ? 'opacity-100' : 'opacity-0'}`}>
                                   <div className="absolute inset-0 bg-white/10 dark:bg-white/5 rounded-full" />
                                   <div className="relative z-10 flex flex-col items-center gap-1">
                                       <div className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md flex items-center gap-1.5 text-[10px] font-medium text-white whitespace-nowrap">
                                            <Command className="w-3 h-3" />
                                            <span>+ Scroll to zoom</span>
                                       </div>
                                       <div className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md flex items-center gap-1.5 text-[10px] font-medium text-white whitespace-nowrap">
                                            <MoveVertical className="w-3 h-3" />
                                            <span>Scroll to change lens size</span>
                                       </div>
                                       {isAltHeld && (
                                            <div className="mt-1 px-2 py-0.5 rounded-full bg-blue-500/80 backdrop-blur-md flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                                                <CopyPlus className="w-3 h-3" />
                                                <span>Duplicate</span>
                                            </div>
                                       )}
                                   </div>
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>
           <div className="absolute bottom-4 right-4 z-20 flex flex-col items-end gap-2">
                {isAltHeld && !draggingLensId && (
                    <div className="bg-blue-500 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur font-medium shadow-lg animate-in fade-in slide-in-from-bottom-2">
                        <CopyPlus className="w-3.5 h-3.5"/> Drag lens to duplicate
                    </div>
                )}
                {isSpaceHeld && (
                    <div className="bg-zinc-900/80 dark:bg-white/90 text-white dark:text-zinc-900 text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur font-medium shadow-lg">
                        <Hand className="w-3.5 h-3.5"/> Panning
                    </div>
                )}
           </div>
      </div>

      <div className="h-12 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-6 flex-shrink-0 z-30 transition-colors duration-200">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 hidden sm:flex items-center gap-6">
             <span className="flex items-center gap-1.5"><MousePointer2 className="w-3.5 h-3.5"/> Drag lens</span>
             <span className="flex items-center gap-1.5"><Hand className="w-3.5 h-3.5"/> Hold Space to pan</span>
          </div>

          <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 mr-4 border-r border-zinc-200 dark:border-zinc-800 pr-4 h-6">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">BG</span>
                  <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-md p-0.5">
                      <button
                          onClick={() => setStyle(s => ({ ...s, isBackgroundTransparent: true }))}
                          className={`w-6 h-6 rounded flex items-center justify-center transition-all ${isTransparent ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'}`}
                          title="Transparent"
                      >
                          <Ban className="w-3.5 h-3.5" />
                      </button>
                      <button
                           onClick={() => setStyle(s => ({ ...s, isBackgroundTransparent: false, backgroundColor: '#ffffff' }))}
                           className={`w-6 h-6 rounded flex items-center justify-center transition-all ${!isTransparent && style.backgroundColor === '#ffffff' ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
                           title="White"
                       >
                          <div className="w-3.5 h-3.5 bg-white rounded-full border border-zinc-300"></div>
                      </button>
                       <button
                           onClick={() => setStyle(s => ({ ...s, isBackgroundTransparent: false, backgroundColor: '#000000' }))}
                           className={`w-6 h-6 rounded flex items-center justify-center transition-all ${!isTransparent && style.backgroundColor === '#000000' ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
                           title="Black"
                       >
                          <div className="w-3.5 h-3.5 bg-black rounded-full border border-zinc-600"></div>
                      </button>
                      <div className={`relative w-6 h-6 rounded flex items-center justify-center transition-all ${!isTransparent && style.backgroundColor !== '#ffffff' && style.backgroundColor !== '#000000' ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'hover:bg-zinc-200 dark:hover:bg-zinc-700'}`} title="Custom Color">
                           <div className="w-3.5 h-3.5 rounded-full border border-zinc-300 dark:border-zinc-600 overflow-hidden" style={{ background: !isTransparent && style.backgroundColor !== '#ffffff' && style.backgroundColor !== '#000000' ? style.backgroundColor : 'conic-gradient(from 180deg at 50% 50%, #FF0000 0deg, #00FFE0 88.5deg, #0029FF 171deg, #FF00E6 256.5deg, #FF0000 360deg)' }} />
                           <input
                              type="color"
                              value={style.backgroundColor}
                              onChange={(e) => setStyle(s => ({ ...s, isBackgroundTransparent: false, backgroundColor: e.target.value }))}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                      </div>
                  </div>
              </div>
              <button onClick={fitToScreen} className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800" title="Fit to Screen">
                  <Maximize className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-md p-0.5">
                  <button onClick={() => setViewScale(s => Math.max(MIN_VIEW_SCALE, s - 0.1))} className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors rounded hover:bg-white dark:hover:bg-zinc-700">
                      <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-medium w-8 text-center text-zinc-500 dark:text-zinc-400 tabular-nums">{Math.round(viewScale * 100)}%</span>
                  <button onClick={() => setViewScale(s => Math.min(maxFitScale, s + 0.1))} className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors rounded hover:bg-white dark:hover:bg-zinc-700">
                      <Plus className="w-3.5 h-3.5" />
                  </button>
              </div>
          </div>
      </div>
    </div>
  );
};
