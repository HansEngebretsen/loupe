import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { EditorCanvas } from './components/EditorCanvas';
import { Lens, StyleState, DEFAULT_LENS, DEFAULT_STYLE, DEFAULT_IMAGE } from './types';
import { generateCanvas, downloadCanvasAsPng, copyCanvasToClipboard } from './utils/canvasUtils';

export type Theme = 'light' | 'dark';

function App() {
  const [imageSrc, setImageSrc] = useState<string>(DEFAULT_IMAGE);
  // Manage an array of lenses
  const [lenses, setLenses] = useState<Lens[]>([DEFAULT_LENS]);
  const [style, setStyle] = useState<StyleState>(DEFAULT_STYLE);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imgDimensions, setImgDimensions] = useState({ width: 1000, height: 700 });
  const [theme, setTheme] = useState<Theme>('dark');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Theme toggle effect
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Handle paste events for images
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile();
          if (blob) {
            const url = URL.createObjectURL(blob);
            setImageSrc(url);
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageSrc(url);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  // --- Export Handlers ---
  const prepareCanvas = async (): Promise<HTMLCanvasElement> => {
      setIsProcessing(true);
      const img = new Image();
      img.src = imageSrc;
      await new Promise((resolve) => {
          if (img.complete) resolve(true);
          img.onload = () => resolve(true);
          img.onerror = () => resolve(true);
      });

      try {
          return await generateCanvas(img, lenses, style);
      } finally {
          setIsProcessing(false);
      }
  };

  const handleDownload = async () => {
      if (isProcessing) return;
      try {
          const canvas = await prepareCanvas();
          downloadCanvasAsPng(canvas, 'loupe-export.png');
      } catch (error) {
          alert('Failed to generate image. Try uploading the file directly.');
          console.error(error);
          setIsProcessing(false);
      }
  };

  const handleCopy = async () => {
      if (isProcessing) return;
      try {
         const canvas = await prepareCanvas();
         await copyCanvasToClipboard(canvas);
      } catch (error) {
          alert('Failed to copy. Browser might not support direct image copying.');
          console.error(error);
          setIsProcessing(false);
      }
  };

  // --- Drag & Drop Handlers ---
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingFile(true);
  }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingFile(false);
  }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingFile(false);
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith('image/')) {
          const url = URL.createObjectURL(file);
          setImageSrc(url);
      }
  }, []);

  return (
    <div
        className="flex h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-200 font-sans overflow-hidden transition-colors duration-200"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
    >
      <Sidebar
        lenses={lenses}
        setLenses={setLenses}
        style={style}
        setStyle={setStyle}
        onDownload={handleDownload}
        onCopy={handleCopy}
        onUploadClick={triggerFileUpload}
        isProcessing={isProcessing}
        maxLensSize={Math.max(100, imgDimensions.width)}
        theme={theme}
        setTheme={setTheme}
      />

      <main className="flex-1 relative">
        <EditorCanvas
          imageSrc={imageSrc}
          lenses={lenses}
          setLenses={setLenses}
          style={style}
          setStyle={setStyle}
          onImageDimensionsChange={setImgDimensions}
          theme={theme}
        />

        {/* Drag & Drop Overlay */}
        {isDraggingFile && (
            <div className="absolute inset-0 bg-zinc-900/50 dark:bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-none">
                <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-2xl border-2 border-dashed border-zinc-400 dark:border-zinc-600 flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-200">
                    <p className="text-xl font-medium text-zinc-900 dark:text-white">Drop image to load</p>
                </div>
            </div>
        )}
      </main>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/png, image/jpeg, image/webp, image/gif"
        className="hidden"
      />
    </div>
  );
}

export default App;