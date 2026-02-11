import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
}

export function Tabs({ children }: TabsProps) {
  return <div className="w-full">{children}</div>;
}

interface TabsListProps {
  children: ReactNode;
  className?: string;
}

export function TabsList({ children, className = '' }: TabsListProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 rounded-xl bg-slate-900/60 p-1 border border-slate-800/60',
        className,
      )}
    >
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}

export function TabsTrigger({ active, onClick, children }: TabsTriggerProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3.5 py-1.5 text-sm font-medium rounded-lg transition-all duration-200',
        active
          ? 'bg-slate-800/80 text-slate-100 shadow-sm shadow-black/10'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40',
      )}
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  active: boolean;
  children: ReactNode;
}

export function TabsContent({ active, children }: TabsContentProps) {
  if (!active) return null;
  return <div className="mt-5 animate-fadeIn">{children}</div>;
}
