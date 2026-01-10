/**
 * Summary module type definitions
 */

export enum QualityGrade {
  EXCELLENT = 'EXCELLENT',
  GOOD = 'GOOD',
  FAIR = 'FAIR',
  POOR = 'POOR',
}

export interface PageSummary {
  page_id: string
  page_number: number
  dimensions: string
  dpi: number | null
  is_calibrated: boolean
  scale_info: string | null
  warning_count: number
  warnings: string[]
}

export interface UploadSummary {
  upload_id: string
  project_id: string
  filename: string
  file_type: string
  file_size_mb: number
  status: string
  uploaded_at: string
  total_pages: number
  calibrated_pages: number
  pages_with_warnings: number
  quality_grade: QualityGrade
  quality_score: number
  total_warnings: number
  warning_types: Record<string, number>
  pages: PageSummary[]
  processing_duration_seconds: number | null
  error_message: string | null
}

export interface ProjectSummary {
  project_id: string
  project_name: string
  address: string | null
  builder: string | null
  foundation_type: string
  floors: number
  created_at: string
  total_uploads: number
  completed_uploads: number
  failed_uploads: number
  processing_uploads: number
  total_pages: number
  calibrated_pages: number
  average_quality_score: number
  uploads_with_warnings: number
  total_warnings: number
  total_size_mb: number
  uploads: UploadSummary[]
}

export interface DashboardSummary {
  total_projects: number
  total_uploads: number
  total_pages: number
  total_calibrations: number
  uploads_by_status: Record<string, number>
  average_quality_score: number
  uploads_with_warnings: number
  total_storage_mb: number
  recent_uploads: UploadSummary[]
  generated_at: string
}

export type ExportFormat = 'json' | 'csv'

export interface ExportRequest {
  format: ExportFormat
  include_pages?: boolean
  include_warnings?: boolean
}
