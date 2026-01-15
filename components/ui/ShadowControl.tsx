import React from 'react';
import { Slider } from './Slider';
import { ColorPicker } from './ColorPicker';

interface ShadowControlProps {
  label: string;
  color: string;
  onColorChange: (value: string) => void;
  opacity: number;
  onOpacityChange: (value: number) => void;
  blur: number;
  onBlurChange: (value: number) => void;
  spread: number;
  onSpreadChange: (value: number) => void;
  x: number;
  onXChange: (value: number) => void;
  y: number;
  onYChange: (value: number) => void;
}

export const ShadowControl: React.FC<ShadowControlProps> = ({
  label,
  color, onColorChange,
  opacity, onOpacityChange,
  blur, onBlurChange,
  spread, onSpreadChange,
  x, onXChange,
  y, onYChange
}) => {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 tracking-wide select-none">
          {label}
      </label>
      <div className="p-2 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-lg flex flex-col gap-3">
          {/* Row 1: Color + Opacity (horizontal) */}
          <div className="flex items-center gap-3">
              <ColorPicker value={color} onChange={onColorChange} />
              <div className="flex-1">
                  <Slider
                      label="Opacity"
                      value={opacity}
                      min={0} max={1} step={0.01}
                      onChange={onOpacityChange}
                      formatValue={(v) => `${Math.round(v * 100)}%`}
                      compact={false}
                      className="mb-0"
                  />
              </div>
          </div>

          {/* Row 2: Blur and Spread (compact half/half) */}
          <div className="grid grid-cols-2 gap-3">
              <Slider
                  label="Blur"
                  value={blur}
                  min={0} max={200}
                  onChange={onBlurChange}
                  formatValue={(v) => `${v}px`}
                  compact={true}
                  className="mb-0"
              />
              <Slider
                  label="Spread"
                  value={spread}
                  min={-100} max={100}
                  onChange={onSpreadChange}
                  formatValue={(v) => `${v}px`}
                  compact={true}
                  className="mb-0"
              />
          </div>

          {/* Row 3: X / Y Offsets (compact half/half) */}
          <div className="grid grid-cols-2 gap-3">
              <Slider
                  label="Offset X"
                  value={x}
                  min={-100} max={100}
                  onChange={onXChange}
                  compact={true}
                  className="mb-0"
              />
              <Slider
                  label="Offset Y"
                  value={y}
                  min={-100} max={100}
                  onChange={onYChange}
                  compact={true}
                  className="mb-0"
              />
          </div>
      </div>
    </div>
  );
};
