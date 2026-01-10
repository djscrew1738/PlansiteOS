/**
 * Upload summary card component
 */
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { UploadSummary } from '../../types/summary'
import { QualityBadge } from './QualityBadge'

interface UploadSummaryCardProps {
  summary: UploadSummary
  showProjectLink?: boolean
}

export const UploadSummaryCard: React.FC<UploadSummaryCardProps> = ({
  summary,
  showProjectLink = false,
}) => {
  const navigate = useNavigate()

  const statusColor = {
    READY: '#4caf50',
    PROCESSING: '#2196f3',
    FAILED: '#f44336',
    UPLOADED: '#ff9800',
  }[summary.status] || '#9e9e9e'

  return (
    <div
      onClick={() => navigate(`/uploads/${summary.upload_id}`)}
      style={{
        backgroundColor: 'white',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        padding: '16px',
        cursor: 'pointer',
        transition: 'box-shadow 0.2s, border-color 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
        e.currentTarget.style.borderColor = '#2196f3'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.borderColor = '#e0e0e0'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '4px' }}>
            {summary.filename}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {summary.file_type} • {summary.file_size_mb} MB
          </div>
        </div>
        <div
          style={{
            padding: '4px 10px',
            borderRadius: '4px',
            backgroundColor: statusColor,
            color: 'white',
            fontSize: '11px',
            fontWeight: 'bold',
          }}
        >
          {summary.status}
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#888' }}>Pages</div>
          <div style={{ fontWeight: 'bold' }}>{summary.total_pages}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: '#888' }}>Calibrated</div>
          <div style={{ fontWeight: 'bold', color: summary.calibrated_pages > 0 ? '#4caf50' : '#888' }}>
            {summary.calibrated_pages}/{summary.total_pages}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: '#888' }}>Warnings</div>
          <div style={{ fontWeight: 'bold', color: summary.total_warnings > 0 ? '#f57f17' : '#888' }}>
            {summary.total_warnings}
          </div>
        </div>
      </div>

      {/* Quality Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <QualityBadge grade={summary.quality_grade} score={summary.quality_score} size="small" />
        <div style={{ fontSize: '11px', color: '#888' }}>
          {new Date(summary.uploaded_at).toLocaleDateString()}
        </div>
      </div>

      {/* Error Message */}
      {summary.error_message && (
        <div
          style={{
            marginTop: '12px',
            padding: '8px',
            backgroundColor: '#ffebee',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#c62828',
          }}
        >
          {summary.error_message}
        </div>
      )}
    </div>
  )
}
