import { useState, useRef, useEffect } from 'react';
import { CheckIcon, ChevronUpDownIcon, XMarkIcon } from '@heroicons/react/24/outline';

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  multiple?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export default function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  label,
  error,
  disabled = false,
  multiple = false,
  searchable = true,
  clearable = true,
  loading = false,
  emptyMessage = 'No options found',
  className = '',
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedValues = multiple
    ? Array.isArray(value) ? value : (value ? [value] : [])
    : (value ? [value as string] : []);

  const filteredOptions = searchable && searchQuery
    ? options.filter(option =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        option.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const selectedOptions = options.filter(opt => selectedValues.includes(opt.value));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchable && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, searchable]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchQuery]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setSearchQuery('');
      }
    }
  };

  const handleSelect = (optionValue: string) => {
    if (multiple) {
      const newValue = selectedValues.includes(optionValue)
        ? selectedValues.filter(v => v !== optionValue)
        : [...selectedValues, optionValue];
      onChange?.(newValue);
    } else {
      onChange?.(optionValue);
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(multiple ? [] : '');
    setSearchQuery('');
  };

  const handleRemoveTag = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newValue = selectedValues.filter(v => v !== optionValue);
    onChange?.(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (isOpen && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex].value);
        } else {
          setIsOpen(true);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery('');
        break;
      case 'Tab':
        setIsOpen(false);
        setSearchQuery('');
        break;
    }
  };

  return (
    <div className={`w-full ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          {label}
        </label>
      )}

      <div
        className={`
          relative min-h-[42px] px-3 py-2 bg-slate-900 border rounded-lg transition-colors cursor-pointer
          ${error ? 'border-red-500' : 'border-slate-800'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-700'}
          ${isOpen ? 'ring-2 ring-blue-500 border-transparent' : ''}
        `}
        onClick={handleToggle}
      >
        <div className="flex items-center gap-2 flex-wrap">
          {/* Selected Tags (Multiple) */}
          {multiple && selectedOptions.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selectedOptions.map(option => (
                <span
                  key={option.value}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  {option.label}
                  <button
                    onClick={(e) => handleRemoveTag(option.value, e)}
                    className="hover:text-blue-300"
                  >
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Input/Display */}
          {searchable && isOpen ? (
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectedOptions.length > 0 ? '' : placeholder}
              disabled={disabled}
              className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-slate-100 placeholder-slate-500"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="flex-1 text-slate-100">
              {!multiple && selectedOptions.length > 0
                ? selectedOptions[0].label
                : selectedOptions.length === 0 && (
                    <span className="text-slate-500">{placeholder}</span>
                  )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1 ml-auto">
            {loading && (
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            )}
            {clearable && selectedValues.length > 0 && !disabled && (
              <button
                onClick={handleClear}
                className="p-0.5 hover:bg-slate-800 rounded transition-colors"
              >
                <XMarkIcon className="w-4 h-4 text-slate-400" />
              </button>
            )}
            <ChevronUpDownIcon className="w-5 h-5 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg shadow-xl max-h-60 overflow-auto">
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-slate-400 text-center">
              {emptyMessage}
            </div>
          ) : (
            filteredOptions.map((option, index) => {
              const isSelected = selectedValues.includes(option.value);
              const isHighlighted = index === highlightedIndex;

              return (
                <div
                  key={option.value}
                  onClick={() => !option.disabled && handleSelect(option.value)}
                  className={`
                    px-3 py-2 cursor-pointer transition-colors
                    ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    ${isHighlighted ? 'bg-slate-800' : ''}
                    ${isSelected ? 'bg-blue-500/10' : 'hover:bg-slate-800/50'}
                  `}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-slate-100">{option.label}</div>
                      {option.description && (
                        <div className="text-xs text-slate-400 truncate">
                          {option.description}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <CheckIcon className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
}
