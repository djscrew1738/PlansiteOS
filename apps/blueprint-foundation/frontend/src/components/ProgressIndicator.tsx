/**
 * Progress indicator for upload and processing status
 */
import React from 'react'
import { UploadStatus } from '../types'

interface ProgressIndicatorProps {
  status: UploadStatus
  progress?: string[]
  uploadProgress?: number
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  status,
  progress,
  uploadProgress,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case UploadStatus.UPLOADED:
      case UploadStatus.PROCESSING:
        return '#2196F3'
      case UploadStatus.READY:
        return '#4CAF50'
      case UploadStatus.FAILED:
        return '#F44336'
      default:
        return '#999'
    }
  }

  const getStatusText = () => {
    switch (status) {
      case UploadStatus.UPLOADED:
        return 'Uploaded'
      case UploadStatus.PROCESSING:
        return 'Processing...'
      case UploadStatus.READY:
        return 'Ready'
      case UploadStatus.FAILED:
        return 'Failed'
      default:
        return 'Unknown'
    }
  }

  return (
    <div style={{ padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
      <div style={{ marginBottom: '12px' }}>
        <div
          style={{
            display: 'inline-block',
            padding: '6px 12px',
            borderRadius: '4px',
            backgroundColor: getStatusColor(),
            color: 'white',
            fontWeight: 'bold',
            fontSize: '14px',
          }}
        >
          {getStatusText()}
        </div>
      </div>

      {uploadProgress !== undefined && uploadProgress < 100 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '14px', marginBottom: '4px', color: '#666' }}>
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

      {progress && progress.length > 0 && (
        <div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
            Processing steps:
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#666' }}>
            {progress.map((step, index) => (
              <li key={index} style={{ marginBottom: '4px' }}>
                {step}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
