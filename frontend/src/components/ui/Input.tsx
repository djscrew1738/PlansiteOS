import { InputHTMLAttributes, forwardRef, useId } from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id: propId, ...props }, ref) => {
    const generatedId = useId();
    const id = propId || generatedId;
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={
            error ? errorId : hint ? hintId : undefined
          }
          className={cn(
            'h-10 w-full rounded-xl border bg-slate-900/70 px-3.5 text-sm text-slate-100',
            'placeholder-slate-500',
            'shadow-inner shadow-black/10',
            'transition-[border-color,box-shadow] duration-200',
            'focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60',
            error
              ? 'border-red-500/60 focus:ring-red-500/40 focus:border-red-500/60'
              : 'border-slate-800/80 hover:border-slate-700/80',
            className,
          )}
          {...props}
        />
        {error && (
          <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium text-red-400">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={hintId} className="mt-1.5 text-xs text-slate-500">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;
