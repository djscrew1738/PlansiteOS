import { ReactNode, useState } from 'react';
import { cn } from '../../lib/utils';

interface PanelCardProps {
  icon: string;
  title: string;
  children: ReactNode;
  className?: string;
  defaultCollapsed?: boolean;
  animationDelay?: number;
}

export default function PanelCard({
  icon,
  title,
  children,
  className,
  defaultCollapsed = false,
  animationDelay = 0,
}: PanelCardProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div
      className={cn(
        'bg-slate-900 border border-slate-700/80 rounded-xl overflow-hidden animate-fadeIn',
        className
      )}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className="px-4 py-3 border-b border-slate-700/80 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-[13px] text-slate-100">
          <span className="text-[15px]">{icon}</span>
          {title}
        </div>
        <button
          className={cn(
            'text-slate-500 text-base p-0.5 transition-transform bg-transparent border-none cursor-pointer',
            collapsed && '-rotate-90'
          )}
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand' : 'Collapse'}
        >
          ▾
        </button>
      </div>
      {!collapsed && <div className="px-4 py-3">{children}</div>}
    </div>
  );
}
