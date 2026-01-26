import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility function', () => {
  it('should merge class names', () => {
    const result = cn('text-red-500', 'text-blue-500');
    expect(result).toBe('text-blue-500');
  });

  it('should handle conditional classes', () => {
    const result = cn('base-class', true && 'true-class', false && 'false-class');
    expect(result).toBe('base-class true-class');
  });

  it('should handle arrays', () => {
    const result = cn(['class1', 'class2'], 'class3');
    expect(result).toBe('class1 class2 class3');
  });

  it('should handle objects', () => {
    const result = cn({
      'class1': true,
      'class2': false,
      'class3': true,
    });
    expect(result).toBe('class1 class3');
  });

  it('should merge Tailwind conflicting classes correctly', () => {
    const result = cn('px-2 py-1', 'px-4');
    expect(result).toBe('py-1 px-4');
  });

  it('should handle undefined and null values', () => {
    const result = cn('class1', undefined, null, 'class2');
    expect(result).toBe('class1 class2');
  });

  it('should handle empty strings', () => {
    const result = cn('', 'class1', '');
    expect(result).toBe('class1');
  });

  it('should work with complex Tailwind utilities', () => {
    const result = cn(
      'bg-blue-500 hover:bg-blue-600',
      'bg-red-500 hover:bg-red-600'
    );
    // tailwind-merge merges conflicting classes, latest wins
    expect(result).toBe('bg-red-500 hover:bg-red-600');
  });
});
