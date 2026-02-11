import { SelectHTMLAttributes, forwardRef, useId } from 'react';
import { cn } from '../../lib/utils';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className = '', children, ...props }, ref) => {
    const generatedId = useId();
    const id = props.id || generatedId;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="mb-2 block text-sm font-medium text-slate-300">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={cn(
            'h-10 w-full appearance-none rounded-xl border bg-slate-900/70 px-3.5 pr-10 text-sm text-slate-100',
            'shadow-inner shadow-black/10',
            'transition-[border-color,box-shadow] duration-200 cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60',
            error
              ? 'border-red-500/60 focus:ring-red-500/40'
              : 'border-slate-800/80 hover:border-slate-700/80',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p className="mt-1.5 text-xs font-medium text-red-400">{error}</p>}
      </div>
    );
  },
);

Select.displayName = 'Select';

export default Select;
