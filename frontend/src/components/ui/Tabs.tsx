import { ReactNode, useId, KeyboardEvent, useRef } from 'react';
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
  'aria-label'?: string;
}

export function TabsList({ children, className, 'aria-label': ariaLabel }: TabsListProps) {
  const tabsRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const tabs = tabsRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    if (!tabs || tabs.length === 0) return;

    const currentIndex = Array.from(tabs).findIndex((tab) => tab === document.activeElement);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = tabs.length - 1;
    }

    if (nextIndex !== currentIndex) {
      tabs[nextIndex].focus();
      tabs[nextIndex].click();
    }
  };

  return (
    <div
      ref={tabsRef}
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      className={cn('inline-flex bg-slate-900 rounded-lg p-1 border border-slate-800', className)}
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
  id?: string;
  controls?: string;
}

export function TabsTrigger({ value, active, onClick, children, id, controls }: TabsTriggerProps) {
  const generatedId = useId();
  const tabId = id || `tab-${generatedId}`;
  const panelId = controls || `panel-${generatedId}`;

  return (
    <button
      role="tab"
      id={tabId}
      aria-selected={active}
      aria-controls={panelId}
      tabIndex={active ? 0 : -1}
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset',
        active ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-300'
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
  id?: string;
  labelledBy?: string;
}

export function TabsContent({ active, children, id, labelledBy }: TabsContentProps) {
  const generatedId = useId();
  const panelId = id || `panel-${generatedId}`;

  if (!active) return null;

  return (
    <div
      role="tabpanel"
      id={panelId}
      aria-labelledby={labelledBy}
      tabIndex={0}
      className="mt-4 focus:outline-none"
    >
      {children}
    </div>
  );
}
