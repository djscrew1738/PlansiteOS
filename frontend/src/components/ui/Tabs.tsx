import { ReactNode } from 'react';

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
    <div className={`inline-flex bg-slate-900 rounded-lg p-1 border border-slate-800 ${className}`}>
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
      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
        active
          ? 'bg-slate-800 text-slate-100'
          : 'text-slate-400 hover:text-slate-300'
      }`}
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
  return <div className="mt-4">{children}</div>;
}
