import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format, parseISO } from 'date-fns';
import type { JobStatus, EstimateStatus, AlertType } from '../types';

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency (USD)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format currency with cents
 */
export function formatCurrencyDetailed(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Format percentage
 */
export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

/**
 * Format relative time ("2 hours ago")
 */
export function formatRelativeTime(dateString: string): string {
  try {
    return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
  } catch {
    return 'Unknown';
  }
}

/**
 * Format date (Jan 15, 2024)
 */
export function formatDate(dateString: string): string {
  try {
    return format(parseISO(dateString), 'MMM d, yyyy');
  } catch {
    return 'Invalid date';
  }
}

/**
 * Format datetime (Jan 15, 2024 at 3:45 PM)
 */
export function formatDateTime(dateString: string): string {
  try {
    return format(parseISO(dateString), 'MMM d, yyyy \'at\' h:mm a');
  } catch {
    return 'Invalid date';
  }
}

/**
 * Generate initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Get job status color
 */
export function getJobStatusColor(status: JobStatus): string {
  const colors: Record<JobStatus, string> = {
    estimating: 'bg-orange-100 text-orange-800',
    bidding: 'bg-blue-100 text-blue-800',
    awarded: 'bg-success-100 text-success-800',
    inProgress: 'bg-navy-100 text-navy-800',
    onHold: 'bg-warning-100 text-warning-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-danger-100 text-danger-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Get job status label
 */
export function getJobStatusLabel(status: JobStatus): string {
  const labels: Record<JobStatus, string> = {
    estimating: 'Estimating',
    bidding: 'Bidding',
    awarded: 'Awarded',
    inProgress: 'In Progress',
    onHold: 'On Hold',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  return labels[status] || status;
}

/**
 * Get estimate status color
 */
export function getEstimateStatusColor(status: EstimateStatus): string {
  const colors: Record<EstimateStatus, string> = {
    draft: 'bg-gray-100 text-gray-800',
    pending: 'bg-orange-100 text-orange-800',
    sent: 'bg-blue-100 text-blue-800',
    approved: 'bg-success-100 text-success-800',
    rejected: 'bg-danger-100 text-danger-800',
    expired: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Get estimate status label
 */
export function getEstimateStatusLabel(status: EstimateStatus): string {
  const labels: Record<EstimateStatus, string> = {
    draft: 'Draft',
    pending: 'Pending',
    sent: 'Sent',
    approved: 'Approved',
    rejected: 'Rejected',
    expired: 'Expired',
  };
  return labels[status] || status;
}

/**
 * Get alert type icon name (for lucide-react)
 */
export function getAlertIcon(type: AlertType): string {
  const icons: Record<AlertType, string> = {
    jobUpdate: 'Briefcase',
    estimateApproved: 'CheckCircle',
    estimateRejected: 'XCircle',
    bidDue: 'Clock',
    inspectionScheduled: 'Calendar',
    materialDelivery: 'Truck',
    systemUpdate: 'Info',
    other: 'Bell',
  };
  return icons[type] || 'Bell';
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Sleep utility for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Generate random ID
 */
export function generateId(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate profit margin
 */
export function calculateProfitMargin(revenue: number, cost: number): number {
  if (revenue === 0) return 0;
  return ((revenue - cost) / revenue) * 100;
}

/**
 * Calculate markup
 */
export function calculateMarkup(cost: number, markupPercent: number): number {
  return cost * (1 + markupPercent / 100);
}

/**
 * Validate email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (US)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
  return phoneRegex.test(phone);
}
