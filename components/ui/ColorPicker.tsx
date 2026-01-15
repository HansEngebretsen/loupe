import React from 'react';

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange, className = "" }) => {
  return (
      <div className={`relative w-6 h-6 rounded-md overflow-hidden border border-zinc-200 dark:border-zinc-700 shadow-sm flex-shrink-0 transition-transform hover:scale-110 ${className}`}>
          <div className="absolute inset-0" style={{ backgroundColor: value }} />
          <input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="absolute inset-0 w-[200%] h-[200%] -top-1/2 -left-1/2 cursor-pointer opacity-0"
          />
      </div>
  );
};
