import { useState, useRef, useEffect, ReactNode, useId, KeyboardEvent } from 'react';
import { cn } from '../../lib/utils';

interface PopoverProps {
  content: ReactNode;
  children: ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'click' | 'hover';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  'aria-label'?: string;
}

const ARROW_STYLES = {
  top: 'bottom-[-6px] left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent',
  bottom: 'top-[-6px] left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent',
  left: 'right-[-6px] top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent',
  right: 'left-[-6px] top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent',
} as const;

export default function Popover({
  content,
  children,
  placement = 'bottom',
  trigger = 'click',
  open: controlledOpen,
  onOpenChange,
  className,
  'aria-label': ariaLabel,
}: PopoverProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const popoverId = useId();

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const setOpen = (open: boolean) => {
    if (isControlled) {
      onOpenChange?.(open);
    } else {
      setInternalOpen(open);
      onOpenChange?.(open);
    }
  };

  const updatePosition = () => {
    if (!triggerRef.current || !popoverRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const popoverRect = popoverRef.current.getBoundingClientRect();
    let top = 0;
    let left = 0;

    switch (placement) {
      case 'top':
        top = triggerRect.top - popoverRect.height - 8;
        left = triggerRect.left + (triggerRect.width - popoverRect.width) / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + 8;
        left = triggerRect.left + (triggerRect.width - popoverRect.width) / 2;
        break;
      case 'left':
        top = triggerRect.top + (triggerRect.height - popoverRect.height) / 2;
        left = triggerRect.left - popoverRect.width - 8;
        break;
      case 'right':
        top = triggerRect.top + (triggerRect.height - popoverRect.height) / 2;
        left = triggerRect.right + 8;
        break;
    }

    setPosition({ top, left });
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current &&
        popoverRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    if (isOpen) {
      if (trigger === 'click') {
        document.addEventListener('mousedown', handleClickOutside);
      }
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, trigger]);

  const handleTriggerClick = () => {
    if (trigger === 'click') {
      setOpen(!isOpen);
    }
  };

  const handleTriggerKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (trigger === 'click' && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      setOpen(!isOpen);
    }
  };

  const handleMouseEnter = () => {
    if (trigger === 'hover') {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover') {
      timeoutRef.current = setTimeout(() => {
        setOpen(false);
      }, 100);
    }
  };

  return (
    <>
      <div
        ref={triggerRef}
        onClick={handleTriggerClick}
        onKeyDown={handleTriggerKeyDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={trigger === 'hover' ? handleMouseEnter : undefined}
        onBlur={trigger === 'hover' ? handleMouseLeave : undefined}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-controls={isOpen ? popoverId : undefined}
        tabIndex={0}
        className={cn('inline-block', className)}
      >
        {children}
      </div>

      {isOpen && (
        <div
          ref={popoverRef}
          id={popoverId}
          role="dialog"
          aria-label={ariaLabel}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="fixed z-50 animate-fadeIn"
          style={{ top: `${position.top}px`, left: `${position.left}px` }}
        >
          <div className="relative bg-slate-900 border border-slate-800 rounded-lg shadow-xl">
            {content}
            <div
              className={cn('absolute w-0 h-0 border-[6px] border-slate-800', ARROW_STYLES[placement])}
              aria-hidden="true"
            />
          </div>
        </div>
      )}
    </>
  );
}
