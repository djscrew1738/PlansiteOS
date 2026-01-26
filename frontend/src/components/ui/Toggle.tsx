import { forwardRef } from 'react';

interface ToggleProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  ({ checked = false, onChange, disabled = false, label, description, size = 'md', className = '' }, ref) => {
    const sizes = {
      sm: {
        track: 'w-8 h-5',
        thumb: 'w-3 h-3',
        translate: checked ? 'translate-x-3' : 'translate-x-1',
      },
      md: {
        track: 'w-11 h-6',
        thumb: 'w-4 h-4',
        translate: checked ? 'translate-x-5' : 'translate-x-1',
      },
      lg: {
        track: 'w-14 h-7',
        thumb: 'w-5 h-5',
        translate: checked ? 'translate-x-7' : 'translate-x-1',
      },
    };

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
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`
          relative inline-flex flex-shrink-0 rounded-full transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-950
          ${sizes[size].track}
          ${checked ? 'bg-blue-600' : 'bg-slate-700'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${className}
        `}
      >
        <span
          className={`
            ${sizes[size].thumb}
            ${sizes[size].translate}
            inline-block rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out
          `}
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
                onClick={!disabled ? handleToggle : undefined}
                className={`block text-sm font-medium text-slate-200 ${!disabled ? 'cursor-pointer' : ''}`}
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-sm text-slate-400 mt-0.5">{description}</p>
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
