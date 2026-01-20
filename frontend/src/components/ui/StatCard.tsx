import React from 'react';
import { cn } from '../../lib/utils';
import { Card } from './Card';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label?: string;
    isPositive?: boolean;
  };
  subtitle?: string;
  color?: 'orange' | 'navy' | 'success' | 'danger' | 'warning';
  className?: string;
}

export function StatCard({
  title,
  value,
  icon,
  trend,
  subtitle,
  color = 'orange',
  className,
}: StatCardProps) {
  const iconColors = {
    orange: 'bg-orange-100 text-orange-600',
    navy: 'bg-navy-100 text-navy-600',
    success: 'bg-success-100 text-success-600',
    danger: 'bg-danger-100 text-danger-600',
    warning: 'bg-warning-100 text-warning-600',
  };

  return (
    <Card className={cn('hover:shadow-ctl-lg transition-shadow', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              <span
                className={cn(
                  'text-sm font-medium',
                  trend.isPositive ? 'text-success-600' : 'text-danger-600'
                )}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              {trend.label && (
                <span className="text-sm text-gray-500">{trend.label}</span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className={cn('p-3 rounded-lg', iconColors[color])}>{icon}</div>
        )}
      </div>
    </Card>
  );
}
