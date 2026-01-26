import { ReactNode } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

interface DetailSection {
  title: string;
  content: ReactNode;
}

interface DetailAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: ReactNode;
}

interface DetailLayoutProps {
  title: string;
  subtitle?: string;
  badge?: {
    label: string;
    variant?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'slate';
  };
  actions?: DetailAction[];
  sections: DetailSection[];
  sidebar?: ReactNode;
  className?: string;
}

export default function DetailLayout({
  title,
  subtitle,
  badge,
  actions = [],
  sections,
  sidebar,
  className = '',
}: DetailLayoutProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-slate-100 truncate">{title}</h1>
            {badge && (
              <Badge variant={badge.variant}>{badge.label}</Badge>
            )}
          </div>
          {subtitle && (
            <p className="text-slate-400">{subtitle}</p>
          )}
        </div>

        {actions.length > 0 && (
          <div className="flex items-center gap-2 flex-shrink-0">
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

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className={sidebar ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <div className="space-y-6">
            {sections.map((section, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{section.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  {section.content}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        {sidebar && (
          <div className="lg:col-span-1">
            {sidebar}
          </div>
        )}
      </div>
    </div>
  );
}
