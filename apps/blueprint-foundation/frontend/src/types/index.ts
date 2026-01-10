/**
 * TypeScript type definitions for API models
 */

export enum FoundationType {
  SLAB = 'SLAB',
  PIER_BEAM = 'PIER_BEAM',
  UNKNOWN = 'UNKNOWN',
}

export enum UploadStatus {
  UPLOADED = 'UPLOADED',
  PROCESSING = 'PROCESSING',
  READY = 'READY',
  FAILED = 'FAILED',
}

export enum PageStatus {
  READY = 'READY',
  FAILED = 'FAILED',
}

export enum RealUnit {
  FT = 'FT',
  IN = 'IN',
  MM = 'MM',
}

export interface Project {
  id: string
  name: string
  address?: string
  builder?: string
  foundation_type: FoundationType
  floors: number
  created_at: string
}

export interface ProjectCreate {
  name: string
  address?: string
  builder?: string
  foundation_type: FoundationType
  floors: number
}

export interface Upload {
  id: string
  project_id: string
  original_filename: string
  mime_type: string
  size_bytes: number
  storage_key_original: string
  status: UploadStatus
  error_message?: string
  warnings?: string[]
  progress?: string[]
  created_at: string
  pages?: Page[]
}

export interface Page {
  id: string
  upload_id: string
  page_number: number
  width_px: number
  height_px: number
  dpi_estimated?: number
  storage_key_page_png: string
  storage_key_page_thumb?: string
  status: PageStatus
  warnings?: string[]
  created_at: string
}

export interface Calibration {
  id: string
  page_id: string
  p1x: number
  p1y: number
  p2x: number
  p2y: number
  real_distance: number
  real_unit: RealUnit
  pixels_per_unit: number
  created_at: string
}

export interface CalibrationCreate {
  p1x: number
  p1y: number
  p2x: number
  p2y: number
  real_distance: number
  real_unit: RealUnit
}

export interface HealthResponse {
  status: string
  database: string
  redis: string
  storage: string
}
