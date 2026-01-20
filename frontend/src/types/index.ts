// ============================================
// PLANSITEOS TYPE DEFINITIONS
// ============================================

// User & Authentication
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'estimator' | 'fieldTech' | 'viewer';
  avatar?: string;
  phone?: string;
  createdAt: string;
  lastLogin?: string;
}

// Jobs
export interface Job {
  id: string;
  jobNumber: string;
  name: string;
  client: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  status: JobStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedValue: number;
  startDate?: string;
  dueDate?: string;
  assignedTo?: string;
  blueprintCount: number;
  fixtureCount: number;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  notes?: string;
}

export type JobStatus =
  | 'estimating'
  | 'bidding'
  | 'awarded'
  | 'inProgress'
  | 'onHold'
  | 'completed'
  | 'cancelled';

// Estimates
export interface Estimate {
  id: string;
  jobId: string;
  jobName: string;
  estimateNumber: string;
  status: EstimateStatus;
  totalAmount: number;
  lineItems: EstimateLineItem[];
  laborHours: number;
  materialsCost: number;
  markup: number;
  profitMargin: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  validUntil?: string;
  notes?: string;
  revisionNumber: number;
}

export type EstimateStatus =
  | 'draft'
  | 'pending'
  | 'sent'
  | 'approved'
  | 'rejected'
  | 'expired';

export interface EstimateLineItem {
  id: string;
  description: string;
  fixtureType?: FixtureType;
  quantity: number;
  unitCost: number;
  laborHours: number;
  totalCost: number;
  notes?: string;
}

// Fixtures
export type FixtureType =
  | 'waterHeater'
  | 'lavatory'
  | 'kitchenSink'
  | 'toilet'
  | 'tub'
  | 'shower'
  | 'laundryTub'
  | 'floorDrain'
  | 'cleanout'
  | 'waterLine'
  | 'drainLine'
  | 'ventLine'
  | 'gasLine'
  | 'other';

export interface Fixture {
  type: FixtureType;
  count: number;
  confidence?: number;
  location?: string;
  notes?: string;
}

// Blueprints
export interface Blueprint {
  id: string;
  jobId: string;
  name: string;
  fileUrl: string;
  thumbnailUrl?: string;
  pageNumber: number;
  totalPages: number;
  analyzed: boolean;
  fixtures?: Fixture[];
  aiAnalysis?: AIAnalysis;
  uploadedAt: string;
  analyzedAt?: string;
}

export interface AIAnalysis {
  confidence: number;
  fixtures: Fixture[];
  complexity: 'simple' | 'moderate' | 'complex';
  estimatedHours: number;
  warnings?: string[];
  recommendations?: string[];
  rawResponse?: string;
}

// Alerts
export interface Alert {
  id: string;
  type: AlertType;
  severity: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  jobId?: string;
  estimateId?: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  createdAt: string;
  expiresAt?: string;
}

export type AlertType =
  | 'jobUpdate'
  | 'estimateApproved'
  | 'estimateRejected'
  | 'bidDue'
  | 'inspectionScheduled'
  | 'materialDelivery'
  | 'systemUpdate'
  | 'other';

// Vlad (AI Assistant)
export interface VladMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  jobContext?: string;
  estimateContext?: string;
  attachments?: VladAttachment[];
}

export interface VladAttachment {
  type: 'blueprint' | 'estimate' | 'photo';
  id: string;
  name: string;
  url: string;
}

export interface VladConversation {
  id: string;
  title: string;
  messages: VladMessage[];
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

// Dashboard Stats
export interface DashboardStats {
  activeJobs: number;
  pendingEstimates: number;
  totalRevenue: number;
  avgResponseTime: number;
  jobsByStatus: Record<JobStatus, number>;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'job' | 'estimate' | 'alert' | 'upload';
  action: string;
  description: string;
  timestamp: string;
  userId?: string;
  userName?: string;
  relatedId?: string;
}

// UI State
export interface UIState {
  sidebarOpen: boolean;
  mobileNavOpen: boolean;
  theme: 'light' | 'dark';
  currentPage: string;
  loading: boolean;
  error: string | null;
}

// Pricing
export interface PricingConfig {
  waterHeater: number;
  lavatory: number;
  kitchenSink: number;
  toilet: number;
  tub: number;
  shower: number;
  laundryTub: number;
  floorDrain: number;
  cleanout: number;
  laborHourlyRate: number;
  markup: number;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
