/**
 * Project detail page with upload capability
 */
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiClient } from '../api/client'
import { Project, Upload } from '../types'
import { UploadZone } from '../components/UploadZone'

export const ProjectDetail: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [uploads, setUploads] = useState<Upload[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProject()
  }, [projectId])

  const loadProject = async () => {
    if (!projectId) return

    try {
      setLoading(true)
      const [projectData, uploadsData] = await Promise.all([
        apiClient.getProject(projectId),
        apiClient.listUploads(projectId),
      ])
      setProject(projectData)
      setUploads(uploadsData)
    } catch (error) {
      console.error('Failed to load project:', error)
      alert('Failed to load project')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = async (file: File) => {
    if (!projectId) return

    setUploading(true)
    setUploadProgress(0)

    try {
      const upload = await apiClient.uploadFile(projectId, file, (progress) => {
        setUploadProgress(progress)
      })

      // Navigate to upload detail page
      navigate(`/uploads/${upload.id}`)
    } catch (error) {
      console.error('Failed to upload file:', error)
      alert('Failed to upload file')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  if (loading) {
    return <div style={{ padding: '24px', textAlign: 'center' }}>Loading...</div>
  }

  if (!project) {
    return <div style={{ padding: '24px', textAlign: 'center' }}>Project not found</div>
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ marginBottom: '8px' }}>{project.name}</h1>
        {project.address && (
          <p style={{ color: '#666', fontSize: '14px', margin: '4px 0' }}>
            📍 {project.address}
          </p>
        )}
        {project.builder && (
          <p style={{ color: '#666', fontSize: '14px', margin: '4px 0' }}>
            🏗️ {project.builder}
          </p>
        )}
        <p style={{ color: '#666', fontSize: '14px', margin: '4px 0' }}>
          Foundation: {project.foundation_type} | Floors: {project.floors}
        </p>
      </div>

      {/* Upload Zone */}
      <div style={{ marginBottom: '32px' }}>
        <h2>Upload Blueprint</h2>
        <UploadZone onFileSelect={handleFileSelect} disabled={uploading} />
        {uploading && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '14px', marginBottom: '8px' }}>
              Uploading: {uploadProgress}%
            </div>
            <div
              style={{
                width: '100%',
                height: '8px',
                backgroundColor: '#e0e0e0',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${uploadProgress}%`,
                  height: '100%',
                  backgroundColor: '#2196F3',
                  transition: 'width 0.3s',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Uploads List */}
      <div>
        <h2>Uploads ({uploads.length})</h2>
        {uploads.length === 0 ? (
          <p style={{ color: '#999' }}>No uploads yet</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {uploads.map((upload) => (
              <div
                key={upload.id}
                onClick={() => navigate(`/uploads/${upload.id}`)}
                style={{
                  padding: '16px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backgroundColor: 'white',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#2196F3'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e0e0e0'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {upload.original_filename}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {(upload.size_bytes / 1024 / 1024).toFixed(2)} MB | {upload.mime_type}
                    </div>
                  </div>
                  <div
                    style={{
                      padding: '6px 12px',
                      borderRadius: '4px',
                      backgroundColor:
                        upload.status === 'READY'
                          ? '#4CAF50'
                          : upload.status === 'FAILED'
                          ? '#F44336'
                          : '#2196F3',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                  >
                    {upload.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
