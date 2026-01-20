import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Select({
  label,
  options,
  error,
  helperText,
  size = 'md',
  className,
  disabled,
  ...props
}: SelectProps) {
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-5 py-3 text-lg',
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          className={cn(
            'w-full appearance-none rounded-lg border transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-offset-1',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'bg-white pr-10',
            error
              ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500'
              : 'border-gray-300 focus:border-orange-500 focus:ring-orange-500',
            sizes[size],
            className
          )}
          disabled={disabled}
          {...props}
        >
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </div>
      </div>
      {error && <p className="mt-1 text-sm text-danger-600">{error}</p>}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}
