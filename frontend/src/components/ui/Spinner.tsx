import React from 'react';
import { cn } from '../../lib/utils';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'orange' | 'navy' | 'white' | 'gray';
  className?: string;
}

export function Spinner({ size = 'md', color = 'orange', className }: SpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
    xl: 'w-12 h-12 border-4',
  };

  const colors = {
    orange: 'border-orange-200 border-t-orange-600',
    navy: 'border-navy-200 border-t-navy-600',
    white: 'border-white/30 border-t-white',
    gray: 'border-gray-200 border-t-gray-600',
  };

  return (
    <div
      className={cn(
        'inline-block rounded-full animate-spin',
        sizes[size],
        colors[color],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export interface LoadingOverlayProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function LoadingOverlay({ message = 'Loading...', size = 'lg' }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 shadow-ctl-lg flex flex-col items-center gap-4">
        <Spinner size={size} />
        <p className="text-gray-700 font-medium">{message}</p>
      </div>
    </div>
  );
}

export interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function LoadingState({
  message = 'Loading...',
  size = 'md',
  className,
}: LoadingStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-12', className)}>
      <Spinner size={size} />
      <p className="text-gray-600">{message}</p>
    </div>
  );
}
