import { ReactNode, createContext, useContext, useState, useCallback } from 'react';
import Modal from './Modal';
import Button from './Button';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ConfirmOptions {
  title: string;
  message: string | ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

/**
 * Hook to show a confirmation dialog.
 * Returns a promise that resolves to `true` if confirmed, `false` if cancelled.
 *
 * Usage:
 * ```
 * const { confirm } = useConfirm();
 * const confirmed = await confirm({
 *   title: 'Delete Blueprint',
 *   message: 'This action cannot be undone.',
 *   variant: 'danger',
 * });
 * if (confirmed) { ... }
 * ```
 */
export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({
    title: '',
    message: '',
  });
  const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      setResolveRef(() => resolve);
    });
  }, []);

  const handleConfirm = () => {
    setIsOpen(false);
    resolveRef?.(true);
    setResolveRef(null);
  };

  const handleCancel = () => {
    setIsOpen(false);
    resolveRef?.(false);
    setResolveRef(null);
  };

  const iconColors = {
    danger: 'bg-red-500/10 text-red-400',
    warning: 'bg-yellow-500/10 text-yellow-400',
    default: 'bg-blue-500/10 text-blue-400',
  };

  const buttonVariants = {
    danger: 'danger' as const,
    warning: 'primary' as const,
    default: 'primary' as const,
  };

  const variant = options.variant || 'default';

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Modal
        isOpen={isOpen}
        onClose={handleCancel}
        title={options.title}
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${iconColors[variant]}`}>
              <ExclamationTriangleIcon className="w-5 h-5" />
            </div>
            <div className="text-sm text-slate-300">
              {typeof options.message === 'string' ? <p>{options.message}</p> : options.message}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={handleCancel}>
              {options.cancelLabel || 'Cancel'}
            </Button>
            <Button
              variant={buttonVariants[variant]}
              onClick={handleConfirm}
              className={variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {options.confirmLabel || 'Confirm'}
            </Button>
          </div>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  );
}
