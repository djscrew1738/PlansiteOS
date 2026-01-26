import { describe, it, expect, beforeEach, vi } from 'vitest';
import { formatRelativeTime, formatCurrency, formatNumber } from './formatters';

describe('formatRelativeTime', () => {
  beforeEach(() => {
    // Mock current time to 2024-01-15 12:00:00
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  it('should return "just now" for times less than 1 minute ago', () => {
    const dateString = new Date('2024-01-15T11:59:30Z').toISOString();
    expect(formatRelativeTime(dateString)).toBe('just now');
  });

  it('should return minutes ago for times less than 1 hour ago', () => {
    const dateString = new Date('2024-01-15T11:30:00Z').toISOString();
    expect(formatRelativeTime(dateString)).toBe('30m ago');
  });

  it('should return hours ago for times less than 24 hours ago', () => {
    const dateString = new Date('2024-01-15T08:00:00Z').toISOString();
    expect(formatRelativeTime(dateString)).toBe('4h ago');
  });

  it('should return days ago for times less than 7 days ago', () => {
    const dateString = new Date('2024-01-12T12:00:00Z').toISOString();
    expect(formatRelativeTime(dateString)).toBe('3d ago');
  });

  it('should return formatted date for times more than 7 days ago', () => {
    const dateString = new Date('2024-01-01T12:00:00Z').toISOString();
    const result = formatRelativeTime(dateString);
    expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/); // Match date format
  });

  it('should handle edge case of exactly 1 minute ago', () => {
    const dateString = new Date('2024-01-15T11:59:00Z').toISOString();
    expect(formatRelativeTime(dateString)).toBe('1m ago');
  });

  it('should handle edge case of exactly 1 hour ago', () => {
    const dateString = new Date('2024-01-15T11:00:00Z').toISOString();
    expect(formatRelativeTime(dateString)).toBe('1h ago');
  });

  it('should handle edge case of exactly 1 day ago', () => {
    const dateString = new Date('2024-01-14T12:00:00Z').toISOString();
    expect(formatRelativeTime(dateString)).toBe('1d ago');
  });
});

describe('formatCurrency', () => {
  it('should format positive numbers as USD currency', () => {
    expect(formatCurrency(1234)).toBe('$1,234');
    expect(formatCurrency(1234567)).toBe('$1,234,567');
  });

  it('should format zero correctly', () => {
    expect(formatCurrency(0)).toBe('$0');
  });

  it('should format negative numbers correctly', () => {
    expect(formatCurrency(-1234)).toBe('-$1,234');
  });

  it('should round decimal values to whole numbers', () => {
    expect(formatCurrency(1234.56)).toBe('$1,235');
    expect(formatCurrency(1234.49)).toBe('$1,234');
  });

  it('should handle large numbers', () => {
    expect(formatCurrency(1000000)).toBe('$1,000,000');
  });
});

describe('formatNumber', () => {
  it('should format numbers less than 1000 as is', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(100)).toBe('100');
    expect(formatNumber(999)).toBe('999');
  });

  it('should format thousands with K suffix', () => {
    expect(formatNumber(1000)).toBe('1.0K');
    expect(formatNumber(1500)).toBe('1.5K');
    expect(formatNumber(10000)).toBe('10.0K');
    expect(formatNumber(999999)).toBe('1000.0K');
  });

  it('should format millions with M suffix', () => {
    expect(formatNumber(1000000)).toBe('1.0M');
    expect(formatNumber(1500000)).toBe('1.5M');
    expect(formatNumber(10000000)).toBe('10.0M');
  });

  it('should round to 1 decimal place', () => {
    expect(formatNumber(1234)).toBe('1.2K');
    expect(formatNumber(1567)).toBe('1.6K');
    expect(formatNumber(1234567)).toBe('1.2M');
  });
});
