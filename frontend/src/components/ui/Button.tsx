import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Show a loading spinner and disable the button */
  loading?: boolean;
}

const BUTTON_BASE = [
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold',
  'transition-all duration-200 ease-out',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
  'disabled:opacity-40 disabled:pointer-events-none',
  'select-none',
].join(' ');

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: [
    'bg-gradient-to-b from-blue-500 to-blue-600 text-white',
    'shadow-md shadow-blue-500/20',
    'hover:from-blue-400 hover:to-blue-500 hover:shadow-lg hover:shadow-blue-500/25',
    'active:from-blue-600 active:to-blue-700 active:shadow-sm',
  ].join(' '),
  secondary: [
    'bg-slate-800/80 text-slate-100 border border-slate-700/60',
    'hover:bg-slate-700/80 hover:border-slate-600/60',
    'active:bg-slate-800',
  ].join(' '),
  ghost: [
    'text-slate-400',
    'hover:bg-slate-800/60 hover:text-slate-200',
    'active:bg-slate-700/60',
  ].join(' '),
  danger: [
    'bg-gradient-to-b from-red-500 to-red-600 text-white',
    'shadow-md shadow-red-500/20',
    'hover:from-red-400 hover:to-red-500 hover:shadow-lg hover:shadow-red-500/25',
    'active:from-red-600 active:to-red-700 active:shadow-sm',
  ].join(' '),
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(BUTTON_BASE, BUTTON_VARIANTS[variant], BUTTON_SIZES[size], className)}
        {...props}
      >
        {loading && (
          <svg
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';

export default Button;
