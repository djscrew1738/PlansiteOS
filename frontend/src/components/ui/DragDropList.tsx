import { useState, useRef, ReactNode } from 'react';
import { Bars3Icon } from '@heroicons/react/24/outline';

export interface DragDropItem {
  id: string;
  content: ReactNode;
}

interface DragDropListProps {
  items: DragDropItem[];
  onReorder?: (items: DragDropItem[]) => void;
  renderItem?: (item: DragDropItem, isDragging: boolean) => ReactNode;
  className?: string;
  itemClassName?: string;
  disabled?: boolean;
  showHandle?: boolean;
}

export default function DragDropList({
  items,
  onReorder,
  renderItem,
  className = '',
  itemClassName = '',
  disabled = false,
  showHandle = true,
}: DragDropListProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragItemRef = useRef<number | null>(null);
  const dragOverItemRef = useRef<number | null>(null);

  const handleDragStart = (index: number) => {
    if (disabled) return;
    dragItemRef.current = index;
    setDraggedIndex(index);
  };

  const handleDragEnter = (index: number) => {
    if (disabled) return;
    dragOverItemRef.current = index;
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (disabled) return;

    const dragIndex = dragItemRef.current;
    const dragOverIndex = dragOverItemRef.current;

    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      const newItems = [...items];
      const draggedItem = newItems[dragIndex];

      // Remove from old position
      newItems.splice(dragIndex, 1);

      // Insert at new position
      newItems.splice(dragOverIndex, 0, draggedItem);

      onReorder?.(newItems);
    }

    dragItemRef.current = null;
    dragOverItemRef.current = null;
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const defaultRenderItem = (item: DragDropItem, isDragging: boolean) => (
    <div className={`p-4 ${isDragging ? 'opacity-50' : ''}`}>
      {item.content}
    </div>
  );

  return (
    <div className={`space-y-2 ${className}`}>
      {items.map((item, index) => {
        const isDragging = draggedIndex === index;
        const isDragOver = dragOverIndex === index;

        return (
          <div
            key={item.id}
            draggable={!disabled}
            onDragStart={() => handleDragStart(index)}
            onDragEnter={() => handleDragEnter(index)}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            className={`
              relative bg-slate-900 border border-slate-800 rounded-lg transition-all
              ${!disabled ? 'cursor-move hover:border-slate-700' : 'cursor-default'}
              ${isDragging ? 'opacity-50 scale-95' : ''}
              ${isDragOver && !isDragging ? 'border-blue-500 border-t-2' : ''}
              ${itemClassName}
            `}
          >
            {showHandle && !disabled && (
              <div className="absolute left-0 top-0 bottom-0 flex items-center px-2 cursor-grab active:cursor-grabbing">
                <Bars3Icon className="w-5 h-5 text-slate-500" />
              </div>
            )}

            <div className={showHandle && !disabled ? 'ml-8' : ''}>
              {renderItem ? renderItem(item, isDragging) : defaultRenderItem(item, isDragging)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
