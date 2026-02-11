import { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fadeIn">
      {icon && (
        <div className="mb-5 text-slate-700 animate-float">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold tracking-tight text-slate-300 text-balance">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-slate-500 max-w-sm leading-relaxed text-balance">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
