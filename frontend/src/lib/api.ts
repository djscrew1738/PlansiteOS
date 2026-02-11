// API Client for PlansiteOS Node.js Backend
import type {
  Blueprint,
  BlueprintUploadResponse,
  BlueprintsListResponse,
  BlueprintSummary,
  Bid,
  BidGenerateRequest,
  BidsListResponse,
  HealthStatus,
} from '../types/api';

// Use relative path in dev (proxied by Vite), absolute URL in production
const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? '' : '');

// Default request timeout (30 seconds)
const DEFAULT_TIMEOUT = 30_000;

// Upload timeout (5 minutes for large files)
const UPLOAD_TIMEOUT = 300_000;

class ApiError extends Error {
  constructor(public status: number, message: string, public requestId?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Fetch wrapper with timeout support
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = DEFAULT_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError(408, 'Request timed out. Please try again.');
    }
    // Network errors
    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw new ApiError(0, 'Network error. Please check your connection.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  // Handle empty responses (204, etc.)
  if (res.status === 204) {
    return {} as T;
  }

  let json: any;
  try {
    json = await res.json();
  } catch {
    throw new ApiError(res.status, `Unexpected response from server (status ${res.status})`);
  }

  if (!res.ok || json.success === false) {
    const message = json.error || json.message || `Request failed with status ${res.status}`;
    const requestId = res.headers.get('x-request-id') || undefined;
    throw new ApiError(res.status, message, requestId);
  }

  return json as T;
}

/**
 * Standard JSON headers
 */
const jsonHeaders = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// Blueprints API
export const blueprintsApi = {
  // Upload a blueprint file
  upload: async (file: File, projectName?: string, projectAddress?: string): Promise<BlueprintUploadResponse> => {
    const form = new FormData();
    form.append('blueprint', file);
    if (projectName) form.append('projectName', projectName);
    if (projectAddress) form.append('projectAddress', projectAddress);

    const res = await fetchWithTimeout(
      `${API_BASE}/api/blueprints/upload`,
      { method: 'POST', body: form },
      UPLOAD_TIMEOUT
    );
    return handleResponse<BlueprintUploadResponse>(res);
  },

  // List all blueprints with pagination
  list: async (page = 1, limit = 20): Promise<BlueprintsListResponse> => {
    const res = await fetchWithTimeout(`${API_BASE}/api/blueprints?page=${page}&limit=${limit}`);
    return handleResponse<BlueprintsListResponse>(res);
  },

  // Get a single blueprint by ID
  get: async (id: string): Promise<{ success: boolean; blueprint: Blueprint }> => {
    const res = await fetchWithTimeout(`${API_BASE}/api/blueprints/${encodeURIComponent(id)}`);
    return handleResponse<{ success: boolean; blueprint: Blueprint }>(res);
  },

  // Get blueprint summary (fixture breakdown)
  getSummary: async (id: string): Promise<BlueprintSummary> => {
    const res = await fetchWithTimeout(`${API_BASE}/api/blueprints/${encodeURIComponent(id)}/summary`);
    return handleResponse<BlueprintSummary>(res);
  },

  // Delete a blueprint
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await fetchWithTimeout(
      `${API_BASE}/api/blueprints/${encodeURIComponent(id)}`,
      { method: 'DELETE' }
    );
    return handleResponse<{ success: boolean; message: string }>(res);
  },

  // Generate annotated blueprint
  annotate: async (id: string): Promise<{ success: boolean; annotatedPath: string }> => {
    const res = await fetchWithTimeout(
      `${API_BASE}/api/blueprints/${encodeURIComponent(id)}/annotate`,
      { method: 'POST' }
    );
    return handleResponse<{ success: boolean; annotatedPath: string }>(res);
  },

  // Get blueprint file URL
  fileUrl: (filePath: string): string => {
    return `${API_BASE}${filePath.startsWith('/') ? '' : '/'}${filePath}`;
  },
};

// Bids API
export const bidsApi = {
  // Generate a bid from a blueprint
  generate: async (data: BidGenerateRequest): Promise<{ success: boolean; bid: Bid }> => {
    const res = await fetchWithTimeout(
      `${API_BASE}/api/v1/bids/generate`,
      { method: 'POST', headers: jsonHeaders, body: JSON.stringify(data) }
    );
    return handleResponse<{ success: boolean; bid: Bid }>(res);
  },

  // List all bids with pagination
  list: async (page = 1, limit = 20, status?: string): Promise<BidsListResponse> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.set('status', status);
    const res = await fetchWithTimeout(`${API_BASE}/api/v1/bids?${params}`);
    return handleResponse<BidsListResponse>(res);
  },

  // Get a single bid by ID
  get: async (id: string): Promise<{ success: boolean; bid: Bid }> => {
    const res = await fetchWithTimeout(`${API_BASE}/api/v1/bids/${encodeURIComponent(id)}`);
    return handleResponse<{ success: boolean; bid: Bid }>(res);
  },

  // Update bid details
  update: async (id: string, data: Partial<Bid>): Promise<{ success: boolean; bid: Bid }> => {
    const res = await fetchWithTimeout(
      `${API_BASE}/api/v1/bids/${encodeURIComponent(id)}`,
      { method: 'PUT', headers: jsonHeaders, body: JSON.stringify(data) }
    );
    return handleResponse<{ success: boolean; bid: Bid }>(res);
  },

  // Update bid status
  updateStatus: async (id: string, status: string): Promise<{ success: boolean; bid: Bid }> => {
    const res = await fetchWithTimeout(
      `${API_BASE}/api/v1/bids/${encodeURIComponent(id)}/status`,
      { method: 'PATCH', headers: jsonHeaders, body: JSON.stringify({ status }) }
    );
    return handleResponse<{ success: boolean; bid: Bid }>(res);
  },

  // Clone a bid
  clone: async (id: string): Promise<{ success: boolean; bid: Bid }> => {
    const res = await fetchWithTimeout(
      `${API_BASE}/api/v1/bids/${encodeURIComponent(id)}/clone`,
      { method: 'POST' }
    );
    return handleResponse<{ success: boolean; bid: Bid }>(res);
  },

  // Delete a bid (draft only)
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await fetchWithTimeout(
      `${API_BASE}/api/v1/bids/${encodeURIComponent(id)}`,
      { method: 'DELETE' }
    );
    return handleResponse<{ success: boolean; message: string }>(res);
  },

  // Get pricing by tier
  getPricing: async (tier?: string): Promise<{ success: boolean; pricing: Record<string, unknown> }> => {
    const params = new URLSearchParams();
    if (tier) params.set('tier', tier);
    const url = `${API_BASE}/api/v1/bids/pricing${tier ? `?${params}` : ''}`;
    const res = await fetchWithTimeout(url);
    return handleResponse<{ success: boolean; pricing: Record<string, unknown> }>(res);
  },

  // Get statistics
  getStatistics: async (): Promise<{ success: boolean; statistics: Record<string, unknown> }> => {
    const res = await fetchWithTimeout(`${API_BASE}/api/v1/bids/statistics`);
    return handleResponse<{ success: boolean; statistics: Record<string, unknown> }>(res);
  },
};

// Health API
export const healthApi = {
  check: async (): Promise<HealthStatus> => {
    const res = await fetchWithTimeout(`${API_BASE}/api/health`, {}, 10_000);
    return handleResponse<HealthStatus>(res);
  },

  getStatus: async (): Promise<Record<string, unknown>> => {
    const res = await fetchWithTimeout(`${API_BASE}/api/status`, {}, 10_000);
    return handleResponse<Record<string, unknown>>(res);
  },
};

// Pages API (uses blueprint file paths)
export const pagesApi = {
  // Get image URL for a page (uses blueprint ID as page ID)
  imageUrl: (pageId: string): string => {
    return `${API_BASE}/api/blueprints/${encodeURIComponent(pageId)}/image`;
  },

  // Get calibration data (stored in localStorage for now)
  getCalibration: (pageId: string): { pixelDistance: number; realDistance: number; realUnit: string } | null => {
    try {
      const stored = localStorage.getItem(`calibration-${pageId}`);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },
};

// Export all APIs
export const api = {
  blueprints: blueprintsApi,
  bids: bidsApi,
  health: healthApi,
  pages: pagesApi,
};

export { ApiError };
export default api;
