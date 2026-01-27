import { useEffect } from 'react';
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useAppStore } from '../../stores/appStore';
import { cn } from '../../lib/utils';

const icons = {
  success: CheckCircleIcon,
  error: XCircleIcon,
  warning: ExclamationTriangleIcon,
  info: InformationCircleIcon,
};

const colors = {
  success: 'bg-green-500/10 border-green-500/50 text-green-400',
  error: 'bg-red-500/10 border-red-500/50 text-red-400',
  warning: 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400',
  info: 'bg-blue-500/10 border-blue-500/50 text-blue-400',
};

// Use role="alert" for errors, role="status" for others
const roles: Record<string, 'alert' | 'status'> = {
  success: 'status',
  error: 'alert',
  warning: 'alert',
  info: 'status',
};

interface ToastItemProps {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

function ToastItem({ id, type, title, message }: ToastItemProps) {
  const removeToast = useAppStore((s) => s.removeToast);
  const Icon = icons[type];

  useEffect(() => {
    const timer = setTimeout(() => {
      removeToast(id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [id, removeToast]);

  return (
    <div
      role={roles[type]}
      aria-live={type === 'error' || type === 'warning' ? 'assertive' : 'polite'}
      aria-atomic="true"
      className={cn('flex items-start gap-3 p-4 rounded-lg border animate-slideIn', colors[type])}
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        {message && <p className="text-xs opacity-80 mt-1">{message}</p>}
      </div>
      <button
        onClick={() => removeToast(id)}
        aria-label="Dismiss notification"
        className="text-slate-400 hover:text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
      >
        <XMarkIcon className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useAppStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} />
      ))}
    </div>
  );
}

// Helper hook
export function useToast() {
  const addToast = useAppStore((s) => s.addToast);

  return {
    success: (title: string, message?: string) => addToast({ type: 'success', title, message }),
    error: (title: string, message?: string) => addToast({ type: 'error', title, message }),
    warning: (title: string, message?: string) => addToast({ type: 'warning', title, message }),
    info: (title: string, message?: string) => addToast({ type: 'info', title, message }),
  };
}
