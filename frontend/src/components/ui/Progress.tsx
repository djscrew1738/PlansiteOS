import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface ProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
  label?: ReactNode;
  animated?: boolean;
  striped?: boolean;
  /** Glow effect beneath the bar */
  glow?: boolean;
  className?: string;
}

const SIZES = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

const FILL_GRADIENT = {
  default: 'bg-gradient-to-r from-blue-500 to-blue-400',
  success: 'bg-gradient-to-r from-emerald-500 to-emerald-400',
  warning: 'bg-gradient-to-r from-amber-500 to-amber-400',
  danger: 'bg-gradient-to-r from-red-500 to-red-400',
};

const GLOW_COLORS = {
  default: 'shadow-blue-500/30',
  success: 'shadow-emerald-500/30',
  warning: 'shadow-amber-500/30',
  danger: 'shadow-red-500/30',
};

export default function Progress({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  showLabel = false,
  label,
  animated = false,
  striped = false,
  glow = false,
  className = '',
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const stripedPattern = striped
    ? 'bg-gradient-to-r from-transparent via-white/15 to-transparent bg-[length:2rem_100%]'
    : '';

  const animationClass = animated ? 'animate-progress-slide' : '';

  return (
    <div className={cn('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-2">
          {label && <span className="text-sm font-medium text-slate-300">{label}</span>}
          {showLabel && (
            <span className="text-sm tabular-nums font-medium text-slate-400">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}

      <div className={cn('w-full rounded-full overflow-hidden bg-slate-800/60', SIZES[size])}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            FILL_GRADIENT[variant],
            glow && `shadow-sm ${GLOW_COLORS[variant]}`,
            stripedPattern,
            animationClass,
          )}
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
