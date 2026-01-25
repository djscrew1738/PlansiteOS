import { useState } from 'react';
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import Button from './ui/Button';
import Input from './ui/Input';
import { XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline';

export interface FilterValues {
  dateRange?: { start: string; end: string };
  amountRange?: { min: number; max: number };
  statuses?: string[];
  searchText?: string;
}

interface AdvancedFiltersProps {
  values: FilterValues;
  onChange: (values: FilterValues) => void;
  onClear: () => void;
}

const QUICK_DATE_RANGES = [
  { label: 'Last 7 days', getValue: () => ({ start: format(subDays(new Date(), 7), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') }) },
  { label: 'Last 30 days', getValue: () => ({ start: format(subDays(new Date(), 30), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') }) },
  { label: 'This month', getValue: () => ({ start: format(startOfMonth(new Date()), 'yyyy-MM-dd'), end: format(endOfMonth(new Date()), 'yyyy-MM-dd') }) },
  { label: 'Last month', getValue: () => {
    const lastMonth = subMonths(new Date(), 1);
    return { start: format(startOfMonth(lastMonth), 'yyyy-MM-dd'), end: format(endOfMonth(lastMonth), 'yyyy-MM-dd') };
  }},
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', color: 'slate' },
  { value: 'pending_review', label: 'Pending Review', color: 'yellow' },
  { value: 'approved', label: 'Approved', color: 'green' },
  { value: 'sent', label: 'Sent', color: 'blue' },
  { value: 'accepted', label: 'Won', color: 'green' },
  { value: 'rejected', label: 'Declined', color: 'red' },
];

export default function AdvancedFilters({ values, onChange, onClear }: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDateRangeChange = (range: { start: string; end: string } | undefined) => {
    onChange({ ...values, dateRange: range });
  };

  const handleAmountRangeChange = (min?: number, max?: number) => {
    onChange({
      ...values,
      amountRange: min !== undefined || max !== undefined ? { min: min || 0, max: max || Infinity } : undefined,
    });
  };

  const handleStatusToggle = (status: string) => {
    const currentStatuses = values.statuses || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status];
    onChange({ ...values, statuses: newStatuses.length > 0 ? newStatuses : undefined });
  };

  const activeFilterCount =
    (values.dateRange ? 1 : 0) +
    (values.amountRange ? 1 : 0) +
    (values.statuses && values.statuses.length > 0 ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Toggle Button */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2"
        >
          <FunnelIcon className="w-4 h-4" />
          Advanced Filters
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-semibold bg-blue-500 text-white rounded-full">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            <XMarkIcon className="w-4 h-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="space-y-6 p-4 bg-slate-900 rounded-lg border border-slate-800">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">Date Range</label>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Input
                type="date"
                label="From"
                value={values.dateRange?.start || ''}
                onChange={(e) => handleDateRangeChange(
                  e.target.value ? { start: e.target.value, end: values.dateRange?.end || format(new Date(), 'yyyy-MM-dd') } : undefined
                )}
              />
              <Input
                type="date"
                label="To"
                value={values.dateRange?.end || ''}
                onChange={(e) => handleDateRangeChange(
                  e.target.value ? { start: values.dateRange?.start || format(subDays(new Date(), 30), 'yyyy-MM-dd'), end: e.target.value } : undefined
                )}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK_DATE_RANGES.map((range) => (
                <Button
                  key={range.label}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDateRangeChange(range.getValue())}
                  className="text-xs"
                >
                  {range.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Amount Range */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">Amount Range</label>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                label="Min ($)"
                placeholder="0"
                value={values.amountRange?.min || ''}
                onChange={(e) => handleAmountRangeChange(
                  e.target.value ? parseFloat(e.target.value) : undefined,
                  values.amountRange?.max
                )}
              />
              <Input
                type="number"
                label="Max ($)"
                placeholder="No limit"
                value={values.amountRange?.max === Infinity ? '' : values.amountRange?.max || ''}
                onChange={(e) => handleAmountRangeChange(
                  values.amountRange?.min,
                  e.target.value ? parseFloat(e.target.value) : undefined
                )}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">Status</label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((status) => {
                const isSelected = values.statuses?.includes(status.value);
                return (
                  <button
                    key={status.value}
                    onClick={() => handleStatusToggle(status.value)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {status.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Active Filter Badges */}
      {activeFilterCount > 0 && !isExpanded && (
        <div className="flex flex-wrap gap-2">
          {values.dateRange && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-500/10 text-blue-400 rounded border border-blue-500/20">
              Date: {format(new Date(values.dateRange.start), 'MMM d')} - {format(new Date(values.dateRange.end), 'MMM d, yyyy')}
              <button
                onClick={() => handleDateRangeChange(undefined)}
                className="hover:text-blue-300"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          )}
          {values.amountRange && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-500/10 text-green-400 rounded border border-green-500/20">
              Amount: ${values.amountRange.min || 0} - ${values.amountRange.max === Infinity ? '∞' : values.amountRange.max}
              <button
                onClick={() => handleAmountRangeChange(undefined, undefined)}
                className="hover:text-green-300"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          )}
          {values.statuses && values.statuses.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-purple-500/10 text-purple-400 rounded border border-purple-500/20">
              Status: {values.statuses.length} selected
              <button
                onClick={() => onChange({ ...values, statuses: undefined })}
                className="hover:text-purple-300"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
