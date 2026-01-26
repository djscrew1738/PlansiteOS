import { useState, useRef, useEffect } from 'react';

interface SliderProps {
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  showValue?: boolean;
  disabled?: boolean;
  marks?: { value: number; label: string }[];
  className?: string;
}

export default function Slider({
  value = 0,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  showValue = true,
  disabled = false,
  marks = [],
  className = '',
}: SliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const percentage = ((value - min) / (max - min)) * 100;

  const updateValue = (clientX: number) => {
    if (!trackRef.current || disabled) return;

    const rect = trackRef.current.getBoundingClientRect();
    const offsetX = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const newPercentage = offsetX / rect.width;
    let newValue = min + newPercentage * (max - min);

    // Snap to step
    newValue = Math.round(newValue / step) * step;
    newValue = Math.max(min, Math.min(max, newValue));

    onChange?.(newValue);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    setIsDragging(true);
    updateValue(e.clientX);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      updateValue(e.clientX);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    let newValue = value;
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        e.preventDefault();
        newValue = Math.max(min, value - step);
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        e.preventDefault();
        newValue = Math.min(max, value + step);
        break;
      case 'Home':
        e.preventDefault();
        newValue = min;
        break;
      case 'End':
        e.preventDefault();
        newValue = max;
        break;
      default:
        return;
    }
    onChange?.(newValue);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-slate-300">{label}</label>
          {showValue && (
            <span className="text-sm font-medium text-slate-400">{value}</span>
          )}
        </div>
      )}

      <div className="relative pt-6 pb-2">
        {/* Track */}
        <div
          ref={trackRef}
          onMouseDown={handleMouseDown}
          className={`
            relative h-2 bg-slate-700 rounded-full
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {/* Filled Track */}
          <div
            className="absolute h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${percentage}%` }}
          />

          {/* Thumb */}
          <div
            className={`
              absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-md
              transition-transform
              ${isDragging ? 'scale-110' : ''}
              ${disabled ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}
            `}
            style={{ left: `${percentage}%`, transform: `translate(-50%, -50%)` }}
            onKeyDown={handleKeyDown}
            tabIndex={disabled ? -1 : 0}
            role="slider"
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={value}
            aria-disabled={disabled}
          />
        </div>

        {/* Marks */}
        {marks.length > 0 && (
          <div className="absolute w-full top-10">
            {marks.map((mark) => {
              const markPercentage = ((mark.value - min) / (max - min)) * 100;
              return (
                <div
                  key={mark.value}
                  className="absolute text-xs text-slate-400 -translate-x-1/2"
                  style={{ left: `${markPercentage}%` }}
                >
                  {mark.label}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
