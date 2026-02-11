import { TextareaHTMLAttributes, forwardRef, useId } from 'react';
import { cn } from '../../lib/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', ...props }, ref) => {
    const generatedId = useId();
    const id = props.id || generatedId;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="mb-2 block text-sm font-medium text-slate-300">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          className={cn(
            'w-full rounded-xl border bg-slate-900/70 px-3.5 py-2.5 text-sm text-slate-100',
            'placeholder-slate-500 resize-y min-h-[80px]',
            'shadow-inner shadow-black/10',
            'transition-[border-color,box-shadow] duration-200',
            'focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60',
            error
              ? 'border-red-500/60 focus:ring-red-500/40'
              : 'border-slate-800/80 hover:border-slate-700/80',
            className,
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs font-medium text-red-400">{error}</p>}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';

export default Textarea;
