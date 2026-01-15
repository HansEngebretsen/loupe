
import React, { useState, useRef, useEffect } from 'react';
import { Lens, StyleState, DEFAULT_LENS } from '../types';
import { Slider } from './ui/Slider';
import { ShadowControl } from './ui/ShadowControl';
import { BorderControl } from './ui/BorderControl';
import { Theme } from '../App';
import { Download, Image as ImageIcon, Copy, UploadCloud, Square, RectangleHorizontal, RectangleVertical, ChevronRight, Ban, Sun, Moon, CircleHelp, Plus, Trash2 } from 'lucide-react';

interface SidebarProps {
  lenses: Lens[];
  setLenses: React.Dispatch<React.SetStateAction<Lens[]>>;
  style: StyleState;
  setStyle: React.Dispatch<React.SetStateAction<StyleState>>;
  onDownload: () => void;
  onCopy: () => void;
  onUploadClick: () => void;
  isProcessing: boolean;
  maxLensSize: number;
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const Logo = ({ className = "" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 23.71 23.89" className={`w-6 h-6 text-zinc-900 dark:text-white fill-current ${className}`}>
    <path d="M10.01.05c2.79-.15,7.03.02,9.58,1.18.92.41,1.58.9,1.49,1.99-.12,1.58-.55,3.35-.76,4.95-.06.4-.12.81-.17,1.21-.11.96-.06,1.13.25,2.02,1.03,2.89,2.22,5.73,3.26,8.62.48,2.21-3.38,2.99-4.93,3.28-4.29.8-10.01.81-14.29-.08-1.4-.29-4.68-1.13-4.45-3.05,1.11-3.3,2.53-6.48,3.64-9.78-.13-1.05-.27-2.11-.41-3.15-.18-1.32-.52-2.84-.6-4.14-.11-1.71,2.54-2.34,3.84-2.6,1.11-.23,2.4-.38,3.53-.44ZM17.2,2.99c.1-.15-.45-.32-.56-.35-2.05-.62-5.52-.62-7.65-.38-.84.1-1.78.24-2.53.63-.01.06.05.08.09.11.65.42,3.14.65,3.98.68,1.75.07,3.78,0,5.5-.34.16-.03,1.12-.27,1.17-.35ZM22.31,19.41l-2.9-7.5c-.21.07-.4.17-.61.24-3.78,1.28-10.21,1.34-13.96-.03-.12-.04-.52-.27-.59-.22l-2.87,7.44.06.06c1.27-.64,2.78-.96,4.18-1.17,2.6-.39,5.36-.47,7.98-.37,2.37.09,5.14.32,7.41,1.02.44.14.87.31,1.29.52ZM22.38,20.9c.05-.15-.1-.25-.19-.33-1.29-1.07-5.68-1.45-7.39-1.56-3.62-.24-8.51-.19-11.98.95-.28.09-1.43.54-1.46.85.05.21.39.38.58.48,2.16,1.17,6.58,1.48,9.05,1.53,2.85.06,8.55-.22,11.01-1.64.06-.03.38-.24.39-.27Z"/>
  </svg>
);

const Section: React.FC<{ title: React.ReactNode; children: React.ReactNode; rightElement?: React.ReactNode }> = ({ title, children, rightElement }) => (
  <div className="flex flex-col pt-8 pb-4 border-b border-zinc-200 dark:border-zinc-800 last:border-0">
    <div className="px-6 mb-4 flex items-center justify-between">
         <h3 className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 select-none flex items-center gap-2">
            {title}
        </h3>
        {rightElement}
    </div>
    <div className="flex flex-col">
        {children}
    </div>
  </div>
);

const Subsection: React.FC<{ title: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean; rightElement?: React.ReactNode }> = ({ title, children, defaultOpen = false, rightElement }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const contentRef = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState<number | undefined>(defaultOpen ? undefined : 0);

    useEffect(() => {
        if (isOpen) {
            setHeight(contentRef.current?.scrollHeight);
        } else {
            setHeight(0);
        }
    }, [isOpen]);

    return (
        <div className="border-t border-zinc-100 dark:border-zinc-800/50 first:border-t-0">
             <div className="flex items-center justify-between pr-6 group/header hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex-1 flex items-center justify-between pl-6 pr-2 py-3.5 text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 hover:text-zinc-950 dark:hover:text-white select-none"
                >
                    <span>{title}</span>
                    <ChevronRight className={`w-4 h-4 text-zinc-400/70 group-hover/header:text-zinc-600 dark:group-hover/header:text-zinc-300 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
                </button>
                {rightElement}
            </div>
             <div
                className="overflow-hidden transition-[height] duration-300 ease-in-out"
                style={{ height: isOpen ? (height !== undefined ? `${height}px` : 'auto') : '0px' }}
             >
                 <div ref={contentRef} className="flex flex-col px-6 pb-6 pt-2 gap-4">
                     {children}
                 </div>
             </div>
        </div>
    )
}

export const Sidebar: React.FC<SidebarProps> = ({
  lenses, setLenses, style, setStyle, onDownload, onCopy, onUploadClick, isProcessing, maxLensSize, theme, setTheme
}) => {

  const updateLens = (id: string, key: keyof Lens, val: number | string) => {
    setLenses(prev => prev.map(l => l.id === id ? { ...l, [key]: val } : l));
  };

  const addLens = () => {
      setLenses(prev => [
          ...prev,
          {
              ...DEFAULT_LENS,
              id: crypto.randomUUID(),
              x: 0.5,
              y: 0.5,
              ...(prev.length > 0 ? {
                  size: prev[prev.length - 1].size,
                  zoom: prev[prev.length - 1].zoom,
                  borderWidth: prev[prev.length - 1].borderWidth,
                  borderColor: prev[prev.length - 1].borderColor,
                  shadowBlur: prev[prev.length - 1].shadowBlur,
                  shadowSpread: prev[prev.length - 1].shadowSpread,
                  shadowOpacity: prev[prev.length - 1].shadowOpacity,
                  shadowColor: prev[prev.length - 1].shadowColor,
                  shadowX: prev[prev.length - 1].shadowX,
                  shadowY: prev[prev.length - 1].shadowY,
              } : {})
          }
      ]);
  };

  const removeLens = (id: string) => {
      if (lenses.length <= 1) return;
      setLenses(prev => prev.filter(l => l.id !== id));
  };

  const updateStyle = (key: keyof StyleState, val: number | string | boolean) => {
    setStyle(prev => ({ ...prev, [key]: val }));
  };

  const isStandardScrim = style.scrimColor === '#000000' || style.scrimColor === '#ffffff';

  const renderLensControls = (lens: Lens) => (
      <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
              <Slider
                  label={<>Zoom <span className="font-normal opacity-50 ml-0.5">(Cmd)</span></>}
                  value={lens.zoom}
                  min={1.5} max={8} step={0.1}
                  onChange={(v) => updateLens(lens.id, 'zoom', v)}
                  formatValue={(v) => `${v.toFixed(1)}x`}
              />
              <Slider
                  label={<>Size <span className="font-normal opacity-50 ml-0.5">(Scr)</span></>}
                  value={lens.size}
                  min={50} max={maxLensSize} step={10}
                  onChange={(v) => updateLens(lens.id, 'size', v)}
                  formatValue={(v) => `${v}px`}
              />
          </div>

          <div className="flex flex-col gap-4">
              <BorderControl
                  color={lens.borderColor}
                  onColorChange={(v) => updateLens(lens.id, 'borderColor', v)}
                  width={lens.borderWidth}
                  onWidthChange={(v) => updateLens(lens.id, 'borderWidth', v)}
              />

              <ShadowControl
                  label="Drop Shadow"
                  color={lens.shadowColor}
                  onColorChange={(v) => updateLens(lens.id, 'shadowColor', v)}
                  opacity={lens.shadowOpacity}
                  onOpacityChange={(v) => updateLens(lens.id, 'shadowOpacity', v)}
                  blur={lens.shadowBlur}
                  onBlurChange={(v) => updateLens(lens.id, 'shadowBlur', v)}
                  spread={lens.shadowSpread}
                  onSpreadChange={(v) => updateLens(lens.id, 'shadowSpread', v)}
                  x={lens.shadowX}
                  onXChange={(v) => updateLens(lens.id, 'shadowX', v)}
                  y={lens.shadowY}
                  onYChange={(v) => updateLens(lens.id, 'shadowY', v)}
              />
          </div>
      </div>
  );

  return (
    <aside className="w-[300px] bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col h-full flex-shrink-0 z-20 transition-colors duration-200 font-sans">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Header */}
          <div className="h-14 flex items-center justify-between flex-shrink-0 px-6 mt-2">
             <a
                 href="http://go/loupeit"
                 target="_blank"
                 rel="noopener noreferrer"
                 className="flex items-center gap-3 group -ml-2 p-2 rounded-lg transition-colors"
             >
                 <Logo className="group-hover:animate-orbit" />
                 <div className="relative h-5 w-24 overflow-hidden">
                     <h1 className="absolute inset-0 flex items-center text-lg font-bold text-zinc-900 dark:text-white tracking-tight leading-none transition-all duration-300 group-hover:-translate-y-8 group-hover:opacity-0">
                         Loupe
                     </h1>
                     <h1 className="absolute inset-0 flex items-center text-[11px] font-medium text-zinc-500 dark:text-zinc-400 tracking-tight leading-none transition-all duration-300 translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
                         go/loupeit
                     </h1>
                 </div>
             </a>
             <div className="flex items-center gap-1">
                 <a
                     href="http://who/henge"
                     target="_blank"
                     rel="noopener noreferrer"
                     className="group flex items-center gap-1.5 p-2 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all overflow-hidden max-w-[32px] hover:max-w-[105px]"
                     title="About"
                 >
                     <CircleHelp className="w-4 h-4 flex-shrink-0" />
                     <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap text-[11px] font-medium">who/henge</span>
                 </a>
                 <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="p-2 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                    title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                 >
                     {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                 </button>
             </div>
          </div>

          {/* Dropzone */}
          <div className="py-6 px-6">
              <div
                  onClick={onUploadClick}
                  className="group h-20 border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 rounded-lg flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                  <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-200 transition-colors">
                      <UploadCloud className="w-4 h-4" />
                      <span className="text-xs font-medium">Upload Image</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-wide">or paste</p>
              </div>
          </div>

        <Section
            title="Lens Configuration"
            rightElement={
                <button
                    onClick={addLens}
                    className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                    title="Add Lens"
                >
                    <Plus className="w-4 h-4" />
                </button>
            }
        >
            <div className="flex flex-col">
                {lenses.map((lens, index) => {
                    if (lenses.length === 1) {
                        return <div key={lens.id} className="px-6 pb-5 pt-1">{renderLensControls(lens)}</div>;
                    }

                    return (
                        <Subsection
                            key={lens.id}
                            title={`Lens ${index + 1}`}
                            defaultOpen={index === lenses.length - 1}
                            rightElement={
                                 <button
                                    onClick={(e) => { e.stopPropagation(); removeLens(lens.id); }}
                                    className="p-1.5 -mr-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-all z-10 opacity-0 group-hover/header:opacity-100"
                                    title="Remove Lens"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            }
                        >
                            {renderLensControls(lens)}
                        </Subsection>
                    );
                })}
            </div>
        </Section>

        <Section title="Crop & Canvas">
             <div className="px-6 flex flex-col gap-2 mb-6">
                 <div className="grid grid-cols-4 gap-2">
                    <button
                        onClick={() => setStyle(s => ({ ...s, baseBlur: 0, baseGrayscale: 0, baseOpacity: 100, scrimOpacity: 0, cropRadius: 0, canvasBorderWidth: 0 }))}
                        className="flex flex-col items-center justify-center gap-1.5 py-2 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 rounded-lg border border-zinc-200 dark:border-zinc-700 transition-all group"
                        title="No Filters"
                    >
                        <Ban className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-200" />
                        <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200">Reset</span>
                    </button>
                    <button
                        onClick={() => setStyle(s => ({ ...s, baseBlur: 8, cropRadius: 24, scrimColor: '#ffffff', scrimOpacity: 30, baseOpacity: 100 }))}
                        className="flex flex-col items-center justify-center gap-1.5 py-2 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 rounded-lg border border-zinc-200 dark:border-zinc-700 transition-all group"
                        title="Light Scrim & Rounded"
                    >
                        <div className="w-3.5 h-3.5 rounded-full bg-zinc-100 border border-zinc-300"></div>
                        <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200">Light</span>
                    </button>
                    <button
                        onClick={() => setStyle(s => ({ ...s, baseBlur: 8, cropRadius: 24, scrimColor: '#000000', scrimOpacity: 40, baseOpacity: 100 }))}
                        className="flex flex-col items-center justify-center gap-1.5 py-2 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 rounded-lg border border-zinc-200 dark:border-zinc-700 transition-all group"
                        title="Dark Scrim & Rounded"
                    >
                         <div className="w-3.5 h-3.5 rounded-full bg-zinc-800 border border-zinc-600"></div>
                        <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200">Dark</span>
                    </button>
                    <button
                        onClick={() => setStyle(s => ({ ...s, baseBlur: 0, cropRadius: 12, scrimOpacity: 0, baseOpacity: 30 }))}
                        className="flex flex-col items-center justify-center gap-1.5 py-2 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 rounded-lg border border-zinc-200 dark:border-zinc-700 transition-all group"
                        title="Opacity Fade & Rounded"
                    >
                        <div className="w-3.5 h-3.5 rounded-sm bg-zinc-400/50 border border-dashed border-zinc-500"></div>
                        <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200">Fade</span>
                    </button>
                </div>
            </div>

            <div className="px-6 pb-4">
                <Slider
                    label="Corner Radius"
                    value={style.cropRadius}
                    min={0} max={100}
                    onChange={(v) => updateStyle('cropRadius', v)}
                    formatValue={(v) => `${v}px`}
                />
            </div>

            <Subsection title="Border & Shadow">
                <BorderControl
                    color={style.canvasBorderColor}
                    onColorChange={(v) => updateStyle('canvasBorderColor', v)}
                    width={style.canvasBorderWidth}
                    onWidthChange={(v) => updateStyle('canvasBorderWidth', v)}
                />
                <ShadowControl
                    label="Canvas Shadow"
                    color={style.canvasShadowColor}
                    onColorChange={(v) => updateStyle('canvasShadowColor', v)}
                    opacity={style.canvasShadowOpacity}
                    onOpacityChange={(v) => updateStyle('canvasShadowOpacity', v)}
                    blur={style.canvasShadowBlur}
                    onBlurChange={(v) => updateStyle('canvasShadowBlur', v)}
                    spread={style.canvasShadowSpread}
                    onSpreadChange={(v) => updateStyle('canvasShadowSpread', v)}
                    x={style.canvasShadowX}
                    onXChange={(v) => updateStyle('canvasShadowX', v)}
                    y={style.canvasShadowY}
                    onYChange={(v) => updateStyle('canvasShadowY', v)}
                />
            </Subsection>

            <Subsection title="Dimensions">
                <div className="flex gap-1 mb-4 p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg">
                    <button onClick={() => setStyle(s => ({ ...s, cropWidth: 100, cropHeight: 100, cropX: 50, cropY: 50 }))} className="flex-1 py-1.5 flex justify-center rounded-md hover:bg-white dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all" title="Original (1:1)">
                        <Square className="w-4 h-4" />
                    </button>
                    <button onClick={() => setStyle(s => ({ ...s, cropWidth: 100, cropHeight: 75, cropX: 50, cropY: 50 }))} className="flex-1 py-1.5 flex justify-center rounded-md hover:bg-white dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all" title="Landscape (4:3)">
                        <RectangleHorizontal className="w-4 h-4" />
                    </button>
                    <button onClick={() => setStyle(s => ({ ...s, cropWidth: 75, cropHeight: 100, cropX: 50, cropY: 50 }))} className="flex-1 py-1.5 flex justify-center rounded-md hover:bg-white dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all" title="Portrait (3:4)">
                        <RectangleVertical className="w-4 h-4" />
                    </button>
                </div>

                <Slider
                    label="Crop Zoom"
                    value={style.cropZoom}
                    min={1} max={3} step={0.05}
                    onChange={(v) => updateStyle('cropZoom', v)}
                    formatValue={(v) => v.toFixed(2)}
                />
                <div className="grid grid-cols-2 gap-3">
                    <Slider
                        label="Width %"
                        value={style.cropWidth}
                        min={20} max={100}
                        onChange={(v) => updateStyle('cropWidth', v)}
                        formatValue={(v) => `${Math.round(v)}`}
                        compact={true}
                        className="mb-0"
                    />
                    <Slider
                        label="Height %"
                        value={style.cropHeight}
                        min={20} max={100}
                        onChange={(v) => updateStyle('cropHeight', v)}
                        formatValue={(v) => `${Math.round(v)}`}
                        compact={true}
                        className="mb-0"
                    />
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                     <Slider
                        label="Pan X %"
                        value={style.cropX}
                        min={0} max={100}
                        onChange={(v) => updateStyle('cropX', v)}
                        formatValue={(v) => `${Math.round(v)}`}
                        compact={true}
                        className="mb-0"
                    />
                    <Slider
                        label="Pan Y %"
                        value={style.cropY}
                        min={0} max={100}
                        onChange={(v) => updateStyle('cropY', v)}
                        formatValue={(v) => `${Math.round(v)}`}
                        compact={true}
                        className="mb-0"
                    />
                </div>
            </Subsection>

            <Subsection title="Background Filters">
                <Slider
                    label="Blur"
                    value={style.baseBlur}
                    min={0} max={30}
                    onChange={(v) => updateStyle('baseBlur', v)}
                    formatValue={(v) => `${v}px`}
                />
                <Slider
                    label="Grayscale"
                    value={style.baseGrayscale}
                    min={0} max={100}
                    onChange={(v) => updateStyle('baseGrayscale', v)}
                    formatValue={(v) => `${v}%`}
                />
                <Slider
                    label="Opacity"
                    value={style.baseOpacity}
                    min={0} max={100}
                    onChange={(v) => updateStyle('baseOpacity', v)}
                    formatValue={(v) => `${v}%`}
                />
                <div className="pt-1">
                     <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg mb-4">
                        <button
                            onClick={() => updateStyle('scrimColor', '#000000')}
                            className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-[4px] transition-all ${style.scrimColor === '#000000' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-300'}`}
                        >
                            Black
                        </button>
                        <button
                            onClick={() => updateStyle('scrimColor', '#ffffff')}
                            className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-[4px] transition-all ${style.scrimColor === '#ffffff' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-300'}`}
                        >
                            White
                        </button>
                         <div className={`relative flex-1 py-1.5 rounded-[4px] transition-all flex items-center justify-center gap-1.5 ${!isStandardScrim ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-300'}`} >
                             <div className="w-3 h-3 rounded-full border border-zinc-300 dark:border-zinc-600" style={{ backgroundColor: !isStandardScrim ? style.scrimColor : 'transparent', background: !isStandardScrim ? style.scrimColor : 'conic-gradient(from 180deg at 50% 50%, #FF0000 0deg, #00FFE0 88.5deg, #0029FF 171deg, #FF00E6 256.5deg, #FF0000 360deg)' }} />
                             <span className="text-[10px] font-bold uppercase tracking-wider">Custom</span>
                             <input
                                 type="color"
                                 value={style.scrimColor}
                                 onChange={(e) => updateStyle('scrimColor', e.target.value)}
                                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                             />
                         </div>
                    </div>
                    <Slider
                        label="Scrim Intensity"
                        value={style.scrimOpacity}
                        min={0} max={90}
                        onChange={(v) => updateStyle('scrimOpacity', v)}
                        formatValue={(v) => `${v}%`}
                    />
                </div>
            </Subsection>
        </Section>
      </div>

      <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex-shrink-0 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
               <div className="flex items-center gap-3">
                   <div className="flex items-center gap-2" title="Toggle transparent background">
                       <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">BG</span>
                       <button
                           onClick={() => updateStyle('isBackgroundTransparent', !style.isBackgroundTransparent)}
                           className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${style.isBackgroundTransparent ? 'bg-zinc-900 dark:bg-zinc-200' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                       >
                           <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white dark:bg-zinc-900 transition-transform ${style.isBackgroundTransparent ? 'translate-x-4' : 'translate-x-1'}`} />
                       </button>
                   </div>
                   <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800" />
                   <div className="flex items-center gap-2" title="Toggle image drop shadow">
                       <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Shadow</span>
                        <button
                           onClick={() => updateStyle('canvasShadowEnabled', !style.canvasShadowEnabled)}
                           className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${style.canvasShadowEnabled ? 'bg-zinc-900 dark:bg-zinc-200' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                       >
                           <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white dark:bg-zinc-900 transition-transform ${style.canvasShadowEnabled ? 'translate-x-4' : 'translate-x-1'}`} />
                       </button>
                   </div>
               </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
              <button
                  onClick={onCopy}
                  disabled={isProcessing}
                  className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold text-sm text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-[0.98] transition-all disabled:opacity-50`}
              >
                  <Copy className="w-4 h-4" />
                  Copy
              </button>
              <button
                  onClick={onDownload}
                  disabled={isProcessing}
                  className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-80`}
              >
                  {isProcessing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white dark:border-zinc-900/30 dark:border-t-zinc-900 rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
                  Save
              </button>
          </div>
      </div>
    </aside>
  );
};
