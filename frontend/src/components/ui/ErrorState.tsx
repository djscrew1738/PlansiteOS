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
    <Card className="border-red-500/20 bg-red-500/[0.04] text-center animate-fadeIn">
      <div className="py-8 px-6">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10">
          <ExclamationTriangleIcon className="h-7 w-7 text-red-400" />
        </div>
        <h3 className="text-lg font-semibold tracking-tight text-red-300">{title}</h3>
        <p className="mt-2 text-sm text-red-400/70 max-w-sm mx-auto leading-relaxed">{message}</p>
        {onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry} className="mt-6">
            Try Again
          </Button>
        )}
      </div>
    </Card>
  );
}
