import { ReactNode } from 'react';

interface ProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
  label?: ReactNode;
  animated?: boolean;
  striped?: boolean;
  className?: string;
}

export default function Progress({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  showLabel = false,
  label,
  animated = false,
  striped = false,
  className = '',
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const variants = {
    default: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
  };

  const stripedPattern = striped
    ? 'bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:2rem_100%]'
    : '';

  const animationClass = animated ? 'animate-progress-slide' : '';

  return (
    <div className={`w-full ${className}`}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-2">
          {label && <span className="text-sm font-medium text-slate-300">{label}</span>}
          {showLabel && (
            <span className="text-sm font-medium text-slate-400">{Math.round(percentage)}%</span>
          )}
        </div>
      )}

      <div className={`w-full bg-slate-700 rounded-full overflow-hidden ${sizes[size]}`}>
        <div
          className={`
            h-full rounded-full transition-all duration-300 ease-out
            ${variants[variant]}
            ${stripedPattern}
            ${animationClass}
          `}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
}
