/**
 * API client for Blueprint Upload Foundation
 */
import axios from 'axios'
import type {
  Project,
  ProjectCreate,
  Upload,
  Page,
  Calibration,
  CalibrationCreate,
  HealthResponse,
} from '../types'
import type {
  DashboardSummary,
  ProjectSummary,
  UploadSummary,
  ExportRequest,
} from '../types/summary'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const apiClient = {
  // Projects
  createProject: async (data: ProjectCreate): Promise<Project> => {
    const response = await api.post('/projects', data)
    return response.data
  },

  getProject: async (projectId: string): Promise<Project> => {
    const response = await api.get(`/projects/${projectId}`)
    return response.data
  },

  // Uploads
  uploadFile: async (
    projectId: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<Upload> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post(`/projects/${projectId}/uploads`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )
          onProgress(percentCompleted)
        }
      },
    })
    return response.data
  },

  getUpload: async (uploadId: string): Promise<Upload> => {
    const response = await api.get(`/uploads/${uploadId}`)
    return response.data
  },

  listUploads: async (projectId: string): Promise<Upload[]> => {
    const response = await api.get(`/projects/${projectId}/uploads`)
    return response.data
  },

  selectPages: async (uploadId: string, pageNumbers: number[]): Promise<Upload> => {
    const response = await api.post(`/uploads/${uploadId}/select-pages`, {
      active_page_numbers: pageNumbers,
    })
    return response.data
  },

  // Pages
  getPageImageUrl: (pageId: string): string => {
    return `${API_BASE_URL}/pages/${pageId}/image`
  },

  getPageThumbUrl: (pageId: string): string => {
    return `${API_BASE_URL}/pages/${pageId}/thumb`
  },

  // Calibration
  createCalibration: async (
    pageId: string,
    data: CalibrationCreate
  ): Promise<Calibration> => {
    const response = await api.post(`/pages/${pageId}/calibration`, data)
    return response.data
  },

  getCalibration: async (pageId: string): Promise<Calibration | null> => {
    try {
      const response = await api.get(`/pages/${pageId}/calibration`)
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null
      }
      throw error
    }
  },

  // Health
  health: async (): Promise<HealthResponse> => {
    const response = await api.get('/health')
    return response.data
  },

  // Summary
  getDashboardSummary: async (limit = 10): Promise<DashboardSummary> => {
    const response = await api.get('/summary/dashboard', { params: { limit } })
    return response.data
  },

  getProjectSummary: async (projectId: string): Promise<ProjectSummary> => {
    const response = await api.get(`/summary/projects/${projectId}`)
    return response.data
  },

  getUploadSummary: async (uploadId: string): Promise<UploadSummary> => {
    const response = await api.get(`/summary/uploads/${uploadId}`)
    return response.data
  },

  exportProjectSummary: async (projectId: string, options: ExportRequest): Promise<Blob> => {
    const response = await api.post(`/summary/projects/${projectId}/export`, options, {
      responseType: 'blob',
    })
    return response.data
  },

  exportUploadSummary: async (uploadId: string, options: ExportRequest): Promise<Blob> => {
    const response = await api.post(`/summary/uploads/${uploadId}/export`, options, {
      responseType: 'blob',
    })
    return response.data
  },
}
