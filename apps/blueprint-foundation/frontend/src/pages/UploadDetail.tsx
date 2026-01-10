/**
 * Upload detail page with processing status and page thumbnails
 */
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiClient } from '../api/client'
import { Upload, UploadStatus } from '../types'
import { ProgressIndicator } from '../components/ProgressIndicator'
import { ThumbnailGrid } from '../components/ThumbnailGrid'

export const UploadDetail: React.FC = () => {
  const { uploadId } = useParams<{ uploadId: string }>()
  const navigate = useNavigate()
  const [upload, setUpload] = useState<Upload | null>(null)
  const [loading, setLoading] = useState(true)
  const [polling, setPolling] = useState(false)

  useEffect(() => {
    loadUpload()
  }, [uploadId])

  // Poll for status updates while processing
  useEffect(() => {
    if (!upload) return
    if (upload.status === UploadStatus.UPLOADED || upload.status === UploadStatus.PROCESSING) {
      const interval = setInterval(() => {
        loadUpload(true)
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [upload?.status])

  const loadUpload = async (isPolling = false) => {
    if (!uploadId) return

    try {
      if (!isPolling) {
        setLoading(true)
      } else {
        setPolling(true)
      }

      const uploadData = await apiClient.getUpload(uploadId)
      setUpload(uploadData)
    } catch (error) {
      console.error('Failed to load upload:', error)
      if (!isPolling) {
        alert('Failed to load upload')
      }
    } finally {
      if (!isPolling) {
        setLoading(false)
      } else {
        setPolling(false)
      }
    }
  }

  if (loading) {
    return <div style={{ padding: '24px', textAlign: 'center' }}>Loading...</div>
  }

  if (!upload) {
    return <div style={{ padding: '24px', textAlign: 'center' }}>Upload not found</div>
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => navigate(`/projects/${upload.project_id}`)}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            border: '2px solid #e0e0e0',
            borderRadius: '4px',
            backgroundColor: 'white',
            cursor: 'pointer',
            marginBottom: '16px',
          }}
        >
          ← Back to Project
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ marginBottom: '8px' }}>{upload.original_filename}</h1>
            <p style={{ color: '#666', fontSize: '14px' }}>
              {(upload.size_bytes / 1024 / 1024).toFixed(2)} MB | {upload.mime_type}
            </p>
          </div>
          {upload.status === UploadStatus.READY && (
            <button
              onClick={() => navigate(`/uploads/${uploadId}/summary`)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              View Summary & Export
            </button>
          )}
        </div>
      </div>

      {/* Progress Indicator */}
      <div style={{ marginBottom: '32px' }}>
        <ProgressIndicator status={upload.status} progress={upload.progress} />
        {polling && (
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
            Checking for updates...
          </div>
        )}
      </div>

      {/* Error Message */}
      {upload.error_message && (
        <div
          style={{
            padding: '16px',
            backgroundColor: '#ffebee',
            border: '2px solid #f44336',
            borderRadius: '8px',
            marginBottom: '32px',
          }}
        >
          <div style={{ fontWeight: 'bold', color: '#d32f2f', marginBottom: '8px' }}>
            Error:
          </div>
          <div style={{ color: '#d32f2f' }}>{upload.error_message}</div>
        </div>
      )}

      {/* Warnings */}
      {upload.warnings && upload.warnings.length > 0 && (
        <div
          style={{
            padding: '16px',
            backgroundColor: '#fff3e0',
            border: '2px solid #ff9800',
            borderRadius: '8px',
            marginBottom: '32px',
          }}
        >
          <div style={{ fontWeight: 'bold', color: '#e65100', marginBottom: '8px' }}>
            Warnings:
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#e65100' }}>
            {upload.warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Pages Grid */}
      {upload.pages && upload.pages.length > 0 && (
        <div>
          <h2>Pages ({upload.pages.length})</h2>
          <ThumbnailGrid
            pages={upload.pages}
            onPageClick={(page) => navigate(`/pages/${page.id}`)}
          />
        </div>
      )}

      {upload.status === UploadStatus.READY && (!upload.pages || upload.pages.length === 0) && (
        <div style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
          No pages available
        </div>
      )}
    </div>
  )
}
