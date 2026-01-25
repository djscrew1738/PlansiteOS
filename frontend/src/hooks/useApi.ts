// React Query hooks for PlansiteOS API
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../lib/api';
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

// Query Keys
export const queryKeys = {
  blueprints: ['blueprints'] as const,
  blueprint: (id: string) => ['blueprints', id] as const,
  blueprintSummary: (id: string) => ['blueprints', id, 'summary'] as const,
  bids: ['bids'] as const,
  bid: (id: string) => ['bids', id] as const,
  bidStatistics: ['bids', 'statistics'] as const,
  bidPricing: (tier?: string) => ['bids', 'pricing', tier] as const,
  health: ['health'] as const,
};

// ============ Blueprints Hooks ============

export function useBlueprints(page = 1, limit = 20) {
  return useQuery<BlueprintsListResponse, ApiError>({
    queryKey: [...queryKeys.blueprints, page, limit],
    queryFn: () => api.blueprints.list(page, limit),
  });
}

export function useBlueprint(id: string) {
  return useQuery<{ success: boolean; blueprint: Blueprint }, ApiError>({
    queryKey: queryKeys.blueprint(id),
    queryFn: () => api.blueprints.get(id),
    enabled: !!id,
  });
}

export function useBlueprintSummary(id: string) {
  return useQuery<BlueprintSummary, ApiError>({
    queryKey: queryKeys.blueprintSummary(id),
    queryFn: () => api.blueprints.getSummary(id),
    enabled: !!id,
  });
}

export function useUploadBlueprint() {
  const queryClient = useQueryClient();
  return useMutation<
    BlueprintUploadResponse,
    ApiError,
    { file: File; projectName?: string; projectAddress?: string }
  >({
    mutationFn: ({ file, projectName, projectAddress }) =>
      api.blueprints.upload(file, projectName, projectAddress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blueprints });
    },
  });
}

export function useDeleteBlueprint() {
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean; message: string }, ApiError, string>({
    mutationFn: (id) => api.blueprints.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blueprints });
    },
  });
}

export function useAnnotateBlueprint() {
  return useMutation<{ success: boolean; annotatedPath: string }, ApiError, string>({
    mutationFn: (id) => api.blueprints.annotate(id),
  });
}

// ============ Bids Hooks ============

export function useBids(page = 1, limit = 20, status?: string) {
  return useQuery<BidsListResponse, ApiError>({
    queryKey: [...queryKeys.bids, page, limit, status],
    queryFn: () => api.bids.list(page, limit, status),
  });
}

export function useBid(id: string) {
  return useQuery<{ success: boolean; bid: Bid }, ApiError>({
    queryKey: queryKeys.bid(id),
    queryFn: () => api.bids.get(id),
    enabled: !!id,
  });
}

export function useGenerateBid() {
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean; bid: Bid }, ApiError, BidGenerateRequest>({
    mutationFn: (data) => api.bids.generate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bids });
    },
  });
}

export function useUpdateBid() {
  const queryClient = useQueryClient();
  return useMutation<
    { success: boolean; bid: Bid },
    ApiError,
    { id: string; data: Partial<Bid> }
  >({
    mutationFn: ({ id, data }) => api.bids.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bid(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.bids });
    },
  });
}

export function useUpdateBidStatus() {
  const queryClient = useQueryClient();
  return useMutation<
    { success: boolean; bid: Bid },
    ApiError,
    { id: string; status: string }
  >({
    mutationFn: ({ id, status }) => api.bids.updateStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bid(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.bids });
    },
  });
}

export function useCloneBid() {
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean; bid: Bid }, ApiError, string>({
    mutationFn: (id) => api.bids.clone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bids });
    },
  });
}

export function useDeleteBid() {
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean; message: string }, ApiError, string>({
    mutationFn: (id) => api.bids.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bids });
    },
  });
}

export function useBidStatistics() {
  return useQuery<{ success: boolean; statistics: any }, ApiError>({
    queryKey: queryKeys.bidStatistics,
    queryFn: () => api.bids.getStatistics(),
  });
}

export function useBidPricing(tier?: string) {
  return useQuery<{ success: boolean; pricing: any }, ApiError>({
    queryKey: queryKeys.bidPricing(tier),
    queryFn: () => api.bids.getPricing(tier),
  });
}

// ============ Health Hooks ============

export function useHealth() {
  return useQuery<HealthStatus, ApiError>({
    queryKey: queryKeys.health,
    queryFn: () => api.health.check(),
    refetchInterval: 30000, // Check every 30 seconds
    retry: 1,
  });
}

// ============ Upload/Page Viewer Hooks (adapted from Blueprint API) ============

// Page type for viewer compatibility
export interface Page {
  id: string;
  pageNumber: number;
  imageUrl: string;
  status: 'UPLOADED' | 'PROCESSING' | 'READY' | 'FAILED';
}

export interface Upload {
  id: string;
  projectName: string;
  status: 'UPLOADED' | 'PROCESSING' | 'READY' | 'FAILED';
  pages: Page[];
  totalFixtures: number;
  createdAt: string;
}

// Convert Blueprint to Upload format for viewer compatibility
function blueprintToUpload(blueprint: Blueprint): Upload {
  return {
    id: blueprint.id,
    projectName: blueprint.project_name,
    status: blueprint.status === 'completed' ? 'READY' :
            blueprint.status === 'failed' ? 'FAILED' :
            blueprint.status === 'processing' ? 'PROCESSING' : 'UPLOADED',
    pages: [{
      id: blueprint.id,
      pageNumber: 1,
      imageUrl: blueprint.file_path,
      status: blueprint.status === 'completed' ? 'READY' :
              blueprint.status === 'failed' ? 'FAILED' :
              blueprint.status === 'processing' ? 'PROCESSING' : 'UPLOADED',
    }],
    totalFixtures: blueprint.total_fixtures,
    createdAt: blueprint.created_at,
  };
}

export function useUpload(uploadId: string) {
  const query = useBlueprint(uploadId);
  return {
    ...query,
    data: query.data?.blueprint ? blueprintToUpload(query.data.blueprint) : undefined,
  };
}

export function useUploadPolling(uploadId: string) {
  return useQuery<Upload, ApiError>({
    queryKey: ['upload', uploadId],
    queryFn: async () => {
      const result = await api.blueprints.get(uploadId);
      return blueprintToUpload(result.blueprint);
    },
    enabled: !!uploadId,
    refetchInterval: (data) => {
      // Stop polling once processing is complete
      if (data?.status === 'READY' || data?.status === 'FAILED') {
        return false;
      }
      return 2000; // Poll every 2 seconds while processing
    },
  });
}

export interface Calibration {
  pageId: string;
  pixelDistance: number;
  realDistance: number;
  realUnit: 'FT' | 'IN' | 'M' | 'CM';
  pixelsPerUnit: number;
}

export function useCalibration(pageId: string) {
  // For now, return null since calibration isn't stored on the backend
  // This could be enhanced to store calibration in localStorage or backend
  return useQuery<Calibration | null, ApiError>({
    queryKey: ['calibration', pageId],
    queryFn: async () => {
      // Try to get from localStorage
      const stored = localStorage.getItem(`calibration-${pageId}`);
      if (stored) {
        return JSON.parse(stored) as Calibration;
      }
      return null;
    },
    enabled: !!pageId,
  });
}

export function useSetCalibration() {
  const queryClient = useQueryClient();
  return useMutation<Calibration, Error, Calibration>({
    mutationFn: async (calibration) => {
      // Store in localStorage for now
      localStorage.setItem(`calibration-${calibration.pageId}`, JSON.stringify(calibration));
      return calibration;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['calibration', data.pageId] });
    },
  });
}
