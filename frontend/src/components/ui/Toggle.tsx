import { forwardRef, useId } from 'react';
import { cn } from '../../lib/utils';

export type ToggleSize = 'sm' | 'md' | 'lg';

interface ToggleProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  size?: ToggleSize;
  className?: string;
  'aria-label'?: string;
}

const TOGGLE_SIZES: Record<ToggleSize, { track: string; thumb: string; translateOn: string; translateOff: string }> = {
  sm: {
    track: 'w-8 h-5',
    thumb: 'w-3 h-3',
    translateOn: 'translate-x-3',
    translateOff: 'translate-x-1',
  },
  md: {
    track: 'w-11 h-6',
    thumb: 'w-4 h-4',
    translateOn: 'translate-x-5',
    translateOff: 'translate-x-1',
  },
  lg: {
    track: 'w-14 h-7',
    thumb: 'w-5 h-5',
    translateOn: 'translate-x-7',
    translateOff: 'translate-x-1',
  },
};

const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  ({ checked = false, onChange, disabled = false, label, description, size = 'md', className, 'aria-label': ariaLabel }, ref) => {
    const toggleId = useId();
    const labelId = `${toggleId}-label`;
    const descriptionId = `${toggleId}-description`;
    const sizeConfig = TOGGLE_SIZES[size];

    const handleToggle = () => {
      if (!disabled) {
        onChange?.(!checked);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleToggle();
      }
    };

    const toggleButton = (
      <button
        ref={ref}
        id={toggleId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={!label ? ariaLabel : undefined}
        aria-labelledby={label ? labelId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={cn(
          'relative inline-flex flex-shrink-0 rounded-full transition-colors duration-200 ease-in-out',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-950',
          sizeConfig.track,
          checked ? 'bg-blue-600' : 'bg-slate-700',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
          className
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            sizeConfig.thumb,
            checked ? sizeConfig.translateOn : sizeConfig.translateOff,
            'inline-block rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out'
          )}
        />
      </button>
    );

    if (label || description) {
      return (
        <div className="flex items-start gap-3">
          {toggleButton}
          <div className="flex-1">
            {label && (
              <label
                id={labelId}
                htmlFor={toggleId}
                onClick={!disabled ? handleToggle : undefined}
                className={cn('block text-sm font-medium text-slate-200', !disabled && 'cursor-pointer')}
              >
                {label}
              </label>
            )}
            {description && (
              <p id={descriptionId} className="text-sm text-slate-400 mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>
      );
    }

    return toggleButton;
  }
);

Toggle.displayName = 'Toggle';

export default Toggle;
