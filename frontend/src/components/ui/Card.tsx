import { forwardRef, HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  /** Use glass (frosted) background instead of solid */
  glass?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, hover = false, glass = false, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl border border-slate-800/60 p-5 shadow-sm shadow-black/10',
          glass
            ? 'bg-slate-900/50 backdrop-blur-md'
            : 'bg-slate-900/80',
          hover &&
            'transition-all duration-200 hover:bg-slate-800/70 hover:border-slate-700/70 hover:shadow-md hover:shadow-black/20 cursor-pointer gradient-ring',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = 'Card';

export default Card;

export function CardHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={cn('mb-4', className)}>{children}</div>;
}

export function CardTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={cn('text-base font-semibold tracking-tight text-slate-100', className)}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={cn('text-sm text-slate-400 mt-1 leading-relaxed', className)}>{children}</p>;
}

export function CardContent({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={cn(className)}>{children}</div>;
}
