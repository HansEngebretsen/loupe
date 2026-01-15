import React, { useState, useEffect, useRef } from 'react';

interface SliderProps {
  label: React.ReactNode;
  value: number;
  onChange: (val: number) => void;
  min: number;
  max: number;
  step?: number;
  formatValue?: (val: number) => string;
  compact?: boolean;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({
  label, value, onChange, min, max, step = 1, formatValue = (v) => v.toString(), compact = false, className = "mb-3"
}) => {
  const [localValue, setLocalValue] = useState(formatValue(value));
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isFocused) {
      setLocalValue(formatValue(value));
    }
  }, [value, isFocused, formatValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setLocalValue(newVal);

    const num = parseFloat(newVal);
    if (!isNaN(num)) {
        // Clamp value to min/max for live preview, but allow typing freely
        onChange(Math.min(Math.max(num, min), max));
    }
  };

  const handleBlur = () => {
      setIsFocused(false);
      // On blur, ensure the displayed value matches the actual authoritative value from props, formatted correctly.
      setLocalValue(formatValue(value));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          inputRef.current?.blur();
      }
  };

  const ValueInput = (
      <input
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={handleInputChange}
          onFocus={(e) => { setIsFocused(true); e.target.select(); }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-10 flex-shrink-0 bg-transparent text-right text-xs font-medium font-mono text-zinc-500 dark:text-zinc-400 tabular-nums border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-zinc-400 dark:focus:border-zinc-600 rounded px-1 py-0.5 transition-colors focus:outline-none"
      />
  );

  if (compact) {
      return (
          <div className={`flex flex-col gap-1 ${className}`}>
              <div className="flex items-baseline justify-between">
                  <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 tracking-wide select-none truncate mr-2" title={typeof label === 'string' ? label : undefined}>
                      {label}
                  </label>
                  {ValueInput}
              </div>
              <div className="flex items-center gap-3 h-5">
                  <input
                      type="range"
                      className="flex-1 w-full accent-zinc-900 dark:accent-white h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full appearance-none cursor-ew-resize focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
                      min={min}
                      max={max}
                      step={step}
                      value={value}
                      onChange={(e) => onChange(parseFloat(e.target.value))}
                  />
              </div>
          </div>
      );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <label className="w-20 flex-shrink-0 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 tracking-wide select-none truncate" title={typeof label === 'string' ? label : undefined}>
          {label}
      </label>
      
      <div className="flex flex-1 items-center gap-3">
          <input
            type="range"
            className="flex-1 w-full accent-zinc-900 dark:accent-white h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full appearance-none cursor-ew-resize focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
          />
          {ValueInput}
      </div>
    </div>
  );
};
