import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'slate';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Badge({ children, variant = 'blue', size = 'md', className = '' }: BadgeProps) {
  const variants = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    slate: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm'
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
}
