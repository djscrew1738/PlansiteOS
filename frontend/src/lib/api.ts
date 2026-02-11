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
  UploadLimits,
  BatchUploadResponse,
} from '../types/api';

// Use relative path in dev (proxied by Vite), absolute URL in production
const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? '' : 'http://localhost:8099');

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  const json = await res.json();

  if (!res.ok || json.success === false) {
    const message = json.error || json.message || `Request failed with status ${res.status}`;
    throw new ApiError(res.status, message);
  }

  return json as T;
}

// ---------------------------------------------------------------------------
// Progress-aware upload using XMLHttpRequest (fetch doesn't expose upload
// progress).  Used for large blueprint files to keep the user informed.
// ---------------------------------------------------------------------------

export interface UploadProgressEvent {
  /** Bytes uploaded so far */
  loaded: number;
  /** Total file size in bytes (0 if unknown) */
  total: number;
  /** 0 – 100 */
  percent: number;
}

function uploadWithProgress<T>(
  url: string,
  formData: FormData,
  onProgress?: (e: UploadProgressEvent) => void,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);

    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        onProgress({
          loaded: e.loaded,
          total: e.total,
          percent: e.total ? Math.round((e.loaded / e.total) * 100) : 0,
        });
      });
    }

    xhr.addEventListener('load', () => {
      try {
        const json = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && json.success !== false) {
          resolve(json as T);
        } else {
          const message = json.error?.message || json.error || json.message || `Upload failed (${xhr.status})`;
          reject(new ApiError(xhr.status, message));
        }
      } catch {
        reject(new ApiError(xhr.status, 'Invalid response from server'));
      }
    });

    xhr.addEventListener('error', () => reject(new ApiError(0, 'Network error during upload')));
    xhr.addEventListener('abort', () => reject(new ApiError(0, 'Upload aborted')));
    xhr.addEventListener('timeout', () => reject(new ApiError(0, 'Upload timed out')));

    // 10 minute timeout for very large files
    xhr.timeout = 10 * 60 * 1000;

    xhr.send(formData);
  });
}

// Blueprints API
export const blueprintsApi = {
  // Get upload constraints from server
  getUploadLimits: async (): Promise<UploadLimits> => {
    const res = await fetch(`${API_BASE}/api/blueprints/upload-limits`);
    return handleResponse<UploadLimits>(res);
  },

  // Upload a single blueprint file with upload-progress reporting
  upload: async (
    file: File,
    projectName?: string,
    projectAddress?: string,
    onProgress?: (e: UploadProgressEvent) => void,
  ): Promise<BlueprintUploadResponse> => {
    const form = new FormData();
    form.append('blueprint', file);
    if (projectName) form.append('projectName', projectName);
    if (projectAddress) form.append('projectAddress', projectAddress);

    // For files > 5 MB use the progress-aware XHR uploader
    if (file.size > 5 * 1024 * 1024 && onProgress) {
      return uploadWithProgress<BlueprintUploadResponse>(
        `${API_BASE}/api/blueprints/upload`,
        form,
        onProgress,
      );
    }

    const res = await fetch(`${API_BASE}/api/blueprints/upload`, {
      method: 'POST',
      body: form,
    });
    return handleResponse<BlueprintUploadResponse>(res);
  },

  // Upload multiple blueprint files at once with progress
  uploadBatch: async (
    files: File[],
    projectName?: string,
    projectAddress?: string,
    onProgress?: (e: UploadProgressEvent) => void,
  ): Promise<BatchUploadResponse> => {
    const form = new FormData();
    files.forEach((f) => form.append('blueprints', f));
    if (projectName) form.append('projectName', projectName);
    if (projectAddress) form.append('projectAddress', projectAddress);

    return uploadWithProgress<BatchUploadResponse>(
      `${API_BASE}/api/blueprints/upload-batch`,
      form,
      onProgress,
    );
  },

  // List all blueprints with pagination
  list: async (page = 1, limit = 20): Promise<BlueprintsListResponse> => {
    const res = await fetch(`${API_BASE}/api/blueprints?page=${page}&limit=${limit}`);
    return handleResponse<BlueprintsListResponse>(res);
  },

  // Get a single blueprint by ID
  get: async (id: string): Promise<{ success: boolean; blueprint: Blueprint }> => {
    const res = await fetch(`${API_BASE}/api/blueprints/${id}`);
    return handleResponse<{ success: boolean; blueprint: Blueprint }>(res);
  },

  // Get blueprint summary (fixture breakdown)
  getSummary: async (id: string): Promise<BlueprintSummary> => {
    const res = await fetch(`${API_BASE}/api/blueprints/${id}/summary`);
    return handleResponse<BlueprintSummary>(res);
  },

  // Delete a blueprint
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await fetch(`${API_BASE}/api/blueprints/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<{ success: boolean; message: string }>(res);
  },

  // Generate annotated blueprint
  annotate: async (id: string): Promise<{ success: boolean; annotatedPath: string }> => {
    const res = await fetch(`${API_BASE}/api/blueprints/${id}/annotate`, {
      method: 'POST',
    });
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
    const res = await fetch(`${API_BASE}/api/v1/bids/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<{ success: boolean; bid: Bid }>(res);
  },

  // List all bids with pagination
  list: async (page = 1, limit = 20, status?: string): Promise<BidsListResponse> => {
    let url = `${API_BASE}/api/v1/bids?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    const res = await fetch(url);
    return handleResponse<BidsListResponse>(res);
  },

  // Get a single bid by ID
  get: async (id: string): Promise<{ success: boolean; bid: Bid }> => {
    const res = await fetch(`${API_BASE}/api/v1/bids/${id}`);
    return handleResponse<{ success: boolean; bid: Bid }>(res);
  },

  // Update bid details
  update: async (id: string, data: Partial<Bid>): Promise<{ success: boolean; bid: Bid }> => {
    const res = await fetch(`${API_BASE}/api/v1/bids/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<{ success: boolean; bid: Bid }>(res);
  },

  // Update bid status
  updateStatus: async (id: string, status: string): Promise<{ success: boolean; bid: Bid }> => {
    const res = await fetch(`${API_BASE}/api/v1/bids/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return handleResponse<{ success: boolean; bid: Bid }>(res);
  },

  // Clone a bid
  clone: async (id: string): Promise<{ success: boolean; bid: Bid }> => {
    const res = await fetch(`${API_BASE}/api/v1/bids/${id}/clone`, {
      method: 'POST',
    });
    return handleResponse<{ success: boolean; bid: Bid }>(res);
  },

  // Delete a bid (draft only)
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await fetch(`${API_BASE}/api/v1/bids/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<{ success: boolean; message: string }>(res);
  },

  // Get pricing by tier
  getPricing: async (tier?: string): Promise<{ success: boolean; pricing: any }> => {
    let url = `${API_BASE}/api/v1/bids/pricing`;
    if (tier) url += `?tier=${tier}`;
    const res = await fetch(url);
    return handleResponse<{ success: boolean; pricing: any }>(res);
  },

  // Get statistics
  getStatistics: async (): Promise<{ success: boolean; statistics: any }> => {
    const res = await fetch(`${API_BASE}/api/v1/bids/statistics`);
    return handleResponse<{ success: boolean; statistics: any }>(res);
  },
};

// Health API
export const healthApi = {
  check: async (): Promise<HealthStatus> => {
    const res = await fetch(`${API_BASE}/api/health`);
    return handleResponse<HealthStatus>(res);
  },

  getStatus: async (): Promise<any> => {
    const res = await fetch(`${API_BASE}/api/status`);
    return handleResponse<any>(res);
  },
};

// Pages API (uses blueprint file paths)
export const pagesApi = {
  // Get image URL for a page (uses blueprint ID as page ID)
  imageUrl: (pageId: string): string => {
    return `${API_BASE}/api/pages/${pageId}/image`;
  },

  // Get thumbnail URL for a page
  thumbUrl: (pageId: string): string => {
    return `${API_BASE}/api/pages/${pageId}/thumb`;
  },

  // Get calibration data (stored in localStorage for now)
  getCalibration: (pageId: string): { pixelDistance: number; realDistance: number; realUnit: string } | null => {
    const stored = localStorage.getItem(`calibration-${pageId}`);
    return stored ? JSON.parse(stored) : null;
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
