import { ReactNode } from 'react';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import Button from '../ui/Button';

interface FormSection {
  title?: string;
  description?: string;
  fields: ReactNode;
}

interface FormLayoutProps {
  title: string;
  description?: string;
  sections?: FormSection[];
  children?: ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  isLoading?: boolean;
  layout?: 'single' | 'two-column';
  className?: string;
}

export default function FormLayout({
  title,
  description,
  sections,
  children,
  onSubmit,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  onCancel,
  isLoading = false,
  layout = 'single',
  className = '',
}: FormLayoutProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(e);
  };

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-100">{title}</h1>
          {description && (
            <p className="mt-2 text-slate-400">{description}</p>
          )}
        </div>

        {/* Sections */}
        {sections && sections.length > 0 ? (
          <div className="space-y-6">
            {sections.map((section, index) => (
              <Card key={index}>
                {(section.title || section.description) && (
                  <CardHeader>
                    {section.title && <CardTitle>{section.title}</CardTitle>}
                    {section.description && (
                      <CardDescription>{section.description}</CardDescription>
                    )}
                  </CardHeader>
                )}
                <CardContent>
                  <div className={
                    layout === 'two-column'
                      ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
                      : 'space-y-4'
                  }>
                    {section.fields}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent>
              <div className={
                layout === 'two-column'
                  ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
                  : 'space-y-4'
              }>
                {children}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={isLoading}
            >
              {cancelLabel}
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : submitLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}
