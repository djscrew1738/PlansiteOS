import { useEffect } from 'react';
import {
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { useAppStore } from '../../stores/appStore';

const icons = {
  success: CheckCircleIcon,
  error: XCircleIcon,
  warning: ExclamationTriangleIcon,
  info: InformationCircleIcon,
};

const styles = {
  success: {
    wrapper: 'border-emerald-500/30 bg-emerald-500/[0.08]',
    icon: 'text-emerald-400',
    title: 'text-emerald-300',
  },
  error: {
    wrapper: 'border-red-500/30 bg-red-500/[0.08]',
    icon: 'text-red-400',
    title: 'text-red-300',
  },
  warning: {
    wrapper: 'border-amber-500/30 bg-amber-500/[0.08]',
    icon: 'text-amber-400',
    title: 'text-amber-300',
  },
  info: {
    wrapper: 'border-blue-500/30 bg-blue-500/[0.08]',
    icon: 'text-blue-400',
    title: 'text-blue-300',
  },
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
  const s = styles[type];

  useEffect(() => {
    const timer = setTimeout(() => removeToast(id), 5000);
    return () => clearTimeout(timer);
  }, [id, removeToast]);

  return (
    <div
      className={`
        flex items-start gap-3 rounded-xl border p-4 backdrop-blur-md
        shadow-lg shadow-black/20
        animate-slideIn
        ${s.wrapper}
      `}
    >
      <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${s.icon}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${s.title}`}>{title}</p>
        {message && (
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{message}</p>
        )}
      </div>
      <button
        onClick={() => removeToast(id)}
        className="flex-shrink-0 text-slate-500 transition-colors hover:text-slate-300"
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useAppStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-24 lg:bottom-6 right-4 lg:right-6 z-50 flex flex-col gap-2.5 w-80 max-w-[calc(100vw-2rem)]">
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
