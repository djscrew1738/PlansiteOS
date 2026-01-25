import Card from './Card';
import Button from './Button';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export default function ErrorState({
  title = 'An error occurred',
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <Card className="border-red-500/50 bg-red-500/10 text-center">
      <div className="p-6">
        <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-300">{title}</h3>
        <p className="text-red-400/80 mt-2">{message}</p>
        {onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry} className="mt-6">
            Try Again
          </Button>
        )}
      </div>
    </Card>
  );
}
