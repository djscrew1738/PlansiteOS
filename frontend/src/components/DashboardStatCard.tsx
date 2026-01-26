import { ReactNode } from 'react';
import Card from './ui/Card';
import Tooltip from './ui/Tooltip';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

interface DashboardStatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  description?: string;
  tooltip?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'yellow' | 'purple';
}

export default function DashboardStatCard({
  title,
  value,
  icon,
  description,
  tooltip,
  trend,
  color = 'blue',
}: DashboardStatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500/10',
    green: 'bg-green-500/10',
    yellow: 'bg-yellow-500/10',
    purple: 'bg-purple-500/10',
  };

  const iconColorClasses = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    purple: 'text-purple-400',
  };

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm text-slate-400">{title}</p>
            {tooltip && (
              <Tooltip content={tooltip} placement="top">
                <InformationCircleIcon className="w-4 h-4 text-slate-500 cursor-help" />
              </Tooltip>
            )}
          </div>
          <p className="text-3xl font-bold text-slate-100 mt-1">{value}</p>
          {description && (
            <p className="text-xs text-slate-500 mt-1">{description}</p>
          )}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${
              trend.isPositive ? 'text-green-400' : 'text-red-400'
            }`}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-slate-500 text-xs">vs last month</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <div className={`w-8 h-8 ${iconColorClasses[color]}`}>
            {icon}
          </div>
        </div>
      </div>
    </Card>
  );
}
