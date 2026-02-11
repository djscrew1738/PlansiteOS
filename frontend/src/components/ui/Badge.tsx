import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export type BadgeVariant = 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'slate';
export type BadgeSize = 'sm' | 'md' | 'lg';

export const BADGE_VARIANTS: Record<BadgeVariant, string> = {
  blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-blue-500/5',
  green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/5',
  yellow: 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-amber-500/5',
  red: 'bg-red-500/10 text-red-400 border-red-500/20 shadow-red-500/5',
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-purple-500/5',
  slate: 'bg-slate-500/10 text-slate-400 border-slate-500/20 shadow-slate-500/5',
} as const;

const BADGE_SIZES: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2.5 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
} as const;

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  /** Show a pulsing dot to indicate live status */
  dot?: boolean;
  className?: string;
}

export default function Badge({
  children,
  variant = 'blue',
  size = 'md',
  dot = false,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold border shadow-sm',
        'tracking-wide',
        BADGE_VARIANTS[variant],
        BADGE_SIZES[size],
        className,
      )}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
      {children}
    </span>
  );
}
