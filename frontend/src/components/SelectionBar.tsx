import {
  TrashIcon,
  EnvelopeIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Button from './ui/Button';

interface SelectionBarProps {
  count: number;
  onClear: () => void;
  onDelete?: () => void;
  onEmail?: () => void;
  onExport?: () => void;
}

export default function SelectionBar({
  count,
  onClear,
  onDelete,
  onEmail,
  onExport,
}: SelectionBarProps) {
  if (count === 0) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slideUp">
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl px-4 py-3 flex items-center gap-4">
        {/* Selection count */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-sm font-medium text-slate-200">
            {count} item{count !== 1 ? 's' : ''} selected
          </span>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-700" />

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {onDelete && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onDelete}
              className="hover:bg-red-500/10 hover:text-red-500 hover:border-red-500"
            >
              <TrashIcon className="w-4 h-4 mr-1.5" />
              Delete
            </Button>
          )}

          {onEmail && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onEmail}
            >
              <EnvelopeIcon className="w-4 h-4 mr-1.5" />
              Email
            </Button>
          )}

          {onExport && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onExport}
            >
              <ArrowDownTrayIcon className="w-4 h-4 mr-1.5" />
              Export
            </Button>
          )}

          {/* Clear selection */}
          <button
            onClick={onClear}
            className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-300 transition-colors"
            title="Clear selection"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
