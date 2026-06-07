import { useCallback } from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ParamSliderProps {
  label: string;
  unit: string;
  min: number;
  max: number;
  originalValue: number;
  value: number;
  onChange: (value: number) => void;
  recommendedMin?: number;
  recommendedMax?: number;
  step?: number;
}

export default function ParamSlider({
  label,
  unit,
  min,
  max,
  originalValue,
  value,
  onChange,
  recommendedMin,
  recommendedMax,
  step = 0.01
}: ParamSliderProps) {
  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(e.target.value));
  }, [onChange]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      onChange(Math.min(max, Math.max(min, val)));
    }
  }, [onChange, min, max]);

  const percent = ((value - min) / (max - min)) * 100;
  const originalPercent = ((originalValue - min) / (max - min)) * 100;
  const isChanged = Math.abs(value - originalValue) > step / 2;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-primary">{label}</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <div className="w-2 h-2 rounded-full bg-text-muted/50" />
            <span>原始: {originalValue.toFixed(2)}{unit}</span>
          </div>
          {isChanged && (
            <div className="flex items-center gap-1.5 text-xs text-info-400">
              <div className="w-2 h-2 rounded-full bg-info-400" />
              <span>调整: {value.toFixed(2)}{unit}</span>
            </div>
          )}
        </div>
      </div>

      <div className="relative h-1.5 rounded-full bg-white/5">
        {recommendedMin !== undefined && recommendedMax !== undefined && (
          <div
            className="absolute h-full rounded-full bg-success-500/20"
            style={{
              left: `${((recommendedMin - min) / (max - min)) * 100}%`,
              width: `${((recommendedMax - recommendedMin) / (max - min)) * 100}%`
            }}
          />
        )}

        <div
          className="absolute h-full rounded-full bg-gradient-to-r from-info-500/50 to-info-400/50"
          style={{ width: `${percent}%` }}
        />

        <div
          className="absolute top-1/2 -translate-y-1/2 w-1 h-4 rounded-sm bg-text-muted/60"
          style={{ left: `calc(${originalPercent}% - 0.5px)` }}
        />

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleSliderChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div
          className={cn(
            'absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full',
            'bg-gradient-to-br from-info-400 to-info-600 border-2 border-white/80',
            'shadow-lg shadow-info-500/40 transition-all'
          )}
          style={{ left: `${percent}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleInputChange}
            className="w-24 h-8 px-2.5 rounded-lg bg-primary-950/60 border border-white/10
              text-sm text-text-primary text-center focus:border-info-500/50
              focus:ring-1 focus:ring-info-500/30 transition-all"
          />
          <span className="text-xs text-text-muted">{unit}</span>
        </div>

        <div className="flex items-center gap-1 text-xs text-text-muted">
          <span>{min}{unit}</span>
          <span className="opacity-50">—</span>
          <span>{max}{unit}</span>
          {recommendedMin !== undefined && recommendedMax !== undefined && (
            <>
              <Info className="w-3 h-3 ml-2 text-success-500/70" />
              <span className="text-success-500/70">
                推荐 {recommendedMin}-{recommendedMax}{unit}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
