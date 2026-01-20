import React, { useState } from 'react';
import { cn } from '../../lib/utils';

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number | string;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  activeTab?: string;
  onChange?: (tabId: string) => void;
  variant?: 'underline' | 'pills';
  fullWidth?: boolean;
  className?: string;
}

export function Tabs({
  tabs,
  defaultTab,
  activeTab: controlledActiveTab,
  onChange,
  variant = 'underline',
  fullWidth = false,
  className,
}: TabsProps) {
  const [internalActiveTab, setInternalActiveTab] = useState(
    defaultTab || tabs[0]?.id
  );

  const activeTab = controlledActiveTab ?? internalActiveTab;

  const handleTabClick = (tabId: string) => {
    const tab = tabs.find((t) => t.id === tabId);
    if (tab?.disabled) return;

    setInternalActiveTab(tabId);
    onChange?.(tabId);
  };

  if (variant === 'pills') {
    return (
      <div className={cn('flex gap-2', fullWidth && 'w-full', className)}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            disabled={tab.disabled}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-orange-500',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              fullWidth && 'flex-1 justify-center',
              activeTab === tab.id
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={cn(
                  'px-2 py-0.5 text-xs font-semibold rounded-full',
                  activeTab === tab.id
                    ? 'bg-orange-400 text-white'
                    : 'bg-gray-300 text-gray-700'
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  // Underline variant (default)
  return (
    <div className={cn('border-b border-gray-200', className)}>
      <div className={cn('flex gap-0', fullWidth && 'w-full')}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            disabled={tab.disabled}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-orange-500',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              fullWidth && 'flex-1 justify-center',
              activeTab === tab.id
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={cn(
                  'px-2 py-0.5 text-xs font-semibold rounded-full',
                  activeTab === tab.id
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-gray-200 text-gray-700'
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// Tab Panels component
export interface TabPanelsProps {
  activeTab: string;
  children: React.ReactNode;
  className?: string;
}

export function TabPanels({ activeTab, children, className }: TabPanelsProps) {
  return <div className={cn('mt-4', className)}>{children}</div>;
}

export interface TabPanelProps {
  id: string;
  activeTab: string;
  children: React.ReactNode;
  className?: string;
}

export function TabPanel({ id, activeTab, children, className }: TabPanelProps) {
  if (id !== activeTab) return null;

  return (
    <div className={cn('animate-fade-in', className)}>
      {children}
    </div>
  );
}
