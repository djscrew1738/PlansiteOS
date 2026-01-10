/**
 * Detailed upload summary view with export functionality
 */
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiClient } from '../api/client'
import { UploadSummary, ExportFormat } from '../types/summary'
import { QualityBadge } from '../components/summary/QualityBadge'
import { StatCard } from '../components/summary/StatCard'

export const UploadSummaryView: React.FC = () => {
  const { uploadId } = useParams<{ uploadId: string }>()
  const navigate = useNavigate()
  const [summary, setSummary] = useState<UploadSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (uploadId) loadSummary()
  }, [uploadId])

  const loadSummary = async () => {
    if (!uploadId) return
    try {
      setLoading(true)
      const data = await apiClient.getUploadSummary(uploadId)
      setSummary(data)
    } catch (err) {
      console.error('Failed to load summary:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format: ExportFormat) => {
    if (!uploadId || !summary) return
    try {
      setExporting(true)
      const blob = await apiClient.exportUploadSummary(uploadId, { format })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `upload_summary_${uploadId}.${format}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed:', err)
      alert('Export failed')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return <div style={{ padding: '48px', textAlign: 'center' }}>Loading summary...</div>
  }

  if (!summary) {
    return <div style={{ padding: '48px', textAlign: 'center' }}>Summary not found</div>
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => navigate(`/uploads/${uploadId}`)}
          style={{
            padding: '8px 16px',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            backgroundColor: 'white',
            cursor: 'pointer',
            marginBottom: '16px',
          }}
        >
          ← Back to Upload
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ marginBottom: '8px' }}>{summary.filename}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ color: '#666' }}>{summary.file_type} • {summary.file_size_mb} MB</span>
              <QualityBadge grade={summary.quality_grade} score={summary.quality_score} />
            </div>
          </div>

          {/* Export Buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => handleExport('json')}
              disabled={exporting}
              style={{
                padding: '10px 20px',
                backgroundColor: '#2196f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: exporting ? 'wait' : 'pointer',
                opacity: exporting ? 0.7 : 1,
              }}
            >
              Export JSON
            </button>
            <button
              onClick={() => handleExport('csv')}
              disabled={exporting}
              style={{
                padding: '10px 20px',
                backgroundColor: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: exporting ? 'wait' : 'pointer',
                opacity: exporting ? 0.7 : 1,
              }}
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        <StatCard title="Total Pages" value={summary.total_pages} icon="📄" color="blue" />
        <StatCard
          title="Calibrated"
          value={`${summary.calibrated_pages}/${summary.total_pages}`}
          icon="📐"
          color={summary.calibrated_pages === summary.total_pages ? 'green' : 'yellow'}
        />
        <StatCard
          title="Warnings"
          value={summary.total_warnings}
          icon="⚠️"
          color={summary.total_warnings > 0 ? 'yellow' : 'gray'}
        />
        <StatCard title="Status" value={summary.status} icon="📊" color="blue" />
      </div>

      {/* Warning Types */}
      {Object.keys(summary.warning_types).length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Warning Breakdown</h2>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {Object.entries(summary.warning_types).map(([type, count]) => (
              <div
                key={type}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#fff8e1',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                <strong>{type.replace('_', ' ')}:</strong> {count}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pages Table */}
      <div>
        <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Pages ({summary.pages.length})</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e0e0e0' }}>Page</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e0e0e0' }}>Dimensions</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e0e0e0' }}>DPI</th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e0e0e0' }}>Calibrated</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e0e0e0' }}>Scale</th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e0e0e0' }}>Warnings</th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e0e0e0' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {summary.pages.map((page) => (
                <tr key={page.page_id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>Page {page.page_number}</td>
                  <td style={{ padding: '12px' }}>{page.dimensions}</td>
                  <td style={{ padding: '12px' }}>{page.dpi || 'N/A'}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {page.is_calibrated ? (
                      <span style={{ color: '#4caf50' }}>✓</span>
                    ) : (
                      <span style={{ color: '#ccc' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '12px', fontSize: '13px' }}>{page.scale_info || '—'}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {page.warning_count > 0 ? (
                      <span
                        style={{
                          padding: '2px 8px',
                          backgroundColor: '#fff8e1',
                          borderRadius: '10px',
                          fontSize: '12px',
                          color: '#f57f17',
                        }}
                      >
                        {page.warning_count}
                      </span>
                    ) : (
                      <span style={{ color: '#ccc' }}>0</span>
                    )}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button
                      onClick={() => navigate(`/pages/${page.page_id}`)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#2196f3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Error Message */}
      {summary.error_message && (
        <div
          style={{
            marginTop: '24px',
            padding: '16px',
            backgroundColor: '#ffebee',
            border: '1px solid #f44336',
            borderRadius: '8px',
          }}
        >
          <strong style={{ color: '#c62828' }}>Error:</strong>
          <p style={{ color: '#c62828', margin: '8px 0 0' }}>{summary.error_message}</p>
        </div>
      )}
    </div>
  )
}
