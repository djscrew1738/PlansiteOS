import { useState, useRef, useEffect } from 'react';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function DatePicker({
  value,
  onChange,
  label,
  placeholder = 'Select date...',
  error,
  disabled = false,
  minDate,
  maxDate,
  className = '',
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value || new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const isDisabledDate = (date: Date): boolean => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number): number => {
    return new Date(year, month, 1).getDay();
  };

  const generateCalendarDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const days: (Date | null)[] = [];

    // Previous month's days
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1));
  };

  const handleDateSelect = (date: Date) => {
    if (!isDisabledDate(date)) {
      onChange?.(date);
      setIsOpen(false);
    }
  };

  const handleToday = () => {
    const today = new Date();
    setViewDate(today);
    onChange?.(today);
    setIsOpen(false);
  };

  const calendarDays = generateCalendarDays();
  const today = new Date();

  return (
    <div className={`w-full ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          {label}
        </label>
      )}

      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          relative flex items-center gap-2 px-3 py-2 bg-slate-900 border rounded-lg cursor-pointer transition-colors
          ${error ? 'border-red-500' : 'border-slate-800'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-700'}
          ${isOpen ? 'ring-2 ring-blue-500 border-transparent' : ''}
        `}
      >
        <CalendarIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
        <span className={value ? 'text-slate-100' : 'text-slate-500'}>
          {value ? formatDate(value) : placeholder}
        </span>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 bg-slate-900 border border-slate-800 rounded-lg shadow-xl p-4 w-80">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevMonth}
              className="p-1 hover:bg-slate-800 rounded transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5 text-slate-400" />
            </button>

            <div className="text-sm font-medium text-slate-100">
              {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
            </div>

            <button
              onClick={handleNextMonth}
              className="p-1 hover:bg-slate-800 rounded transition-colors"
            >
              <ChevronRightIcon className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map(day => (
              <div
                key={day}
                className="text-center text-xs font-medium text-slate-400 py-1"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const isSelected = value && isSameDay(date, value);
              const isToday = isSameDay(date, today);
              const isDisabled = isDisabledDate(date);

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => handleDateSelect(date)}
                  disabled={isDisabled}
                  className={`
                    aspect-square flex items-center justify-center text-sm rounded transition-colors
                    ${isSelected
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : isToday
                      ? 'bg-slate-800 text-blue-400 hover:bg-slate-700'
                      : 'text-slate-300 hover:bg-slate-800'
                    }
                    ${isDisabled ? 'opacity-30 cursor-not-allowed' : ''}
                  `}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between">
            <button
              onClick={handleToday}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="text-sm text-slate-400 hover:text-slate-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
}
