import React, { useState, useEffect, useRef } from 'react';
import { ColorPicker } from './ColorPicker';

interface BorderControlProps {
  label?: string;
  color: string;
  onColorChange: (value: string) => void;
  width: number;
  onWidthChange: (value: number) => void;
  min?: number;
  max?: number;
}

export const BorderControl: React.FC<BorderControlProps> = ({
  label = "Border",
  color, onColorChange,
  width, onWidthChange,
  min = 0, max = 40
}) => {
    const [localValue, setLocalValue] = useState(width.toString());
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isFocused) {
            setLocalValue(width.toString());
        }
    }, [width, isFocused]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = e.target.value;
        setLocalValue(newVal);
        const num = parseFloat(newVal);
        if (!isNaN(num)) {
             onWidthChange(Math.min(Math.max(num, min), max));
        }
    };

    const handleBlur = () => {
        setIsFocused(false);
        setLocalValue(width.toString());
    };

     const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            inputRef.current?.blur();
        }
    };

  return (
    <div className="flex items-center gap-3 mb-3">
      <label className="w-20 flex-shrink-0 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 tracking-wide select-none truncate">
          {label}
      </label>
      <div className="flex-1 p-1.5 bg-zinc-50 dark:bg-zinc-900/30 rounded-lg flex items-center gap-3">
          <ColorPicker value={color} onChange={onColorChange} />
          
          <input
            type="range"
            className="flex-1 accent-zinc-900 dark:accent-white h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full appearance-none cursor-ew-resize focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
            min={min}
            max={max}
            value={width}
            onChange={(e) => onWidthChange(parseFloat(e.target.value))}
          />

        <div className="flex items-center relative">
             <input
                ref={inputRef}
                type="text"
                value={localValue}
                onChange={handleInputChange}
                onFocus={(e) => { setIsFocused(true); e.target.select(); }}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="w-9 bg-transparent text-right text-xs font-medium font-mono text-zinc-500 dark:text-zinc-400 tabular-nums border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-zinc-400 dark:focus:border-zinc-600 rounded px-1 py-0.5 transition-colors focus:outline-none pr-3.5"
            />
            <span className="absolute right-1 pointer-events-none text-[10px] text-zinc-400 dark:text-zinc-600 select-none">px</span>
        </div>
      </div>
    </div>
  );
};
