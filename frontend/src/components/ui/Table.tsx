import { ReactNode, TableHTMLAttributes } from 'react';

export function Table({ children, className = '', ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-auto">
      <table className={`w-full border-collapse ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children }: { children: ReactNode }) {
  return <thead className="border-b border-slate-800">{children}</thead>;
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-slate-800">{children}</tbody>;
}

export function TableRow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <tr className={`hover:bg-slate-900/50 transition-colors ${className}`}>{children}</tr>;
}

export function TableHead({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <th className={`px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider ${className}`}>
      {children}
    </th>
  );
}

export function TableCell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-sm text-slate-300 ${className}`}>{children}</td>;
}
