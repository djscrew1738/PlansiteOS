import { ReactNode } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';

interface ListAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: ReactNode;
}

interface ListFilter {
  component: ReactNode;
}

interface ListLayoutProps {
  title: string;
  description?: string;
  actions?: ListAction[];
  filters?: ListFilter[];
  children: ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyState?: {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
  };
  pagination?: ReactNode;
  stats?: ReactNode;
  className?: string;
}

export default function ListLayout({
  title,
  description,
  actions = [],
  filters = [],
  children,
  isLoading = false,
  isEmpty = false,
  emptyState,
  pagination,
  stats,
  className = '',
}: ListLayoutProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">{title}</h1>
          {description && (
            <p className="mt-2 text-slate-400">{description}</p>
          )}
        </div>

        {actions.length > 0 && (
          <div className="flex items-center gap-2">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'primary'}
                onClick={action.onClick}
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      {stats && <div>{stats}</div>}

      {/* Filters */}
      {filters.length > 0 && (
        <Card>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {filters.map((filter, index) => (
                <div key={index}>{filter.component}</div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      {isLoading ? (
        <Card>
          <CardContent>
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          </CardContent>
        </Card>
      ) : isEmpty && emptyState ? (
        <EmptyState
          icon={emptyState.icon}
          title={emptyState.title}
          description={emptyState.description}
          action={emptyState.action}
        />
      ) : (
        <div>{children}</div>
      )}

      {/* Pagination */}
      {pagination && !isEmpty && !isLoading && (
        <div className="flex justify-center">
          {pagination}
        </div>
      )}
    </div>
  );
}
