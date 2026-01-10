/**
 * Main dashboard page with system-wide statistics
 */
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../api/client'
import { DashboardSummary } from '../types/summary'
import { StatCard } from '../components/summary/StatCard'
import { UploadSummaryCard } from '../components/summary/UploadSummaryCard'

export const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getDashboardSummary(10)
      setSummary(data)
    } catch (err) {
      setError('Failed to load dashboard data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', color: '#666' }}>Loading dashboard...</div>
      </div>
    )
  }

  if (error || !summary) {
    return (
      <div style={{ padding: '48px', textAlign: 'center' }}>
        <div style={{ color: '#c62828', marginBottom: '16px' }}>{error || 'No data available'}</div>
        <button
          onClick={loadDashboard}
          style={{
            padding: '12px 24px',
            backgroundColor: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ marginBottom: '8px' }}>Dashboard</h1>
        <p style={{ color: '#666', fontSize: '14px' }}>
          System overview • Last updated: {new Date(summary.generated_at).toLocaleString()}
        </p>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        <StatCard
          title="Projects"
          value={summary.total_projects}
          icon="📁"
          color="blue"
        />
        <StatCard
          title="Uploads"
          value={summary.total_uploads}
          subtitle={`${summary.uploads_by_status['READY'] || 0} ready`}
          icon="📄"
          color="green"
        />
        <StatCard
          title="Pages"
          value={summary.total_pages}
          subtitle={`${summary.total_calibrations} calibrated`}
          icon="📐"
          color="blue"
        />
        <StatCard
          title="Storage"
          value={`${summary.total_storage_mb.toFixed(1)} MB`}
          icon="💾"
          color="gray"
        />
        <StatCard
          title="Quality Score"
          value={`${summary.average_quality_score.toFixed(0)}%`}
          icon="⭐"
          color={summary.average_quality_score >= 70 ? 'green' : 'yellow'}
        />
        <StatCard
          title="With Warnings"
          value={summary.uploads_with_warnings}
          icon="⚠️"
          color={summary.uploads_with_warnings > 0 ? 'yellow' : 'gray'}
        />
      </div>

      {/* Status Breakdown */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '18px' }}>Upload Status</h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {Object.entries(summary.uploads_by_status).map(([status, count]) => (
            <div
              key={status}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                backgroundColor: {
                  READY: '#e8f5e9',
                  PROCESSING: '#e3f2fd',
                  FAILED: '#ffebee',
                  UPLOADED: '#fff8e1',
                }[status] || '#f5f5f5',
                color: {
                  READY: '#2e7d32',
                  PROCESSING: '#1565c0',
                  FAILED: '#c62828',
                  UPLOADED: '#f57f17',
                }[status] || '#616161',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              {status}: {count}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Uploads */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', margin: 0 }}>Recent Uploads</h2>
          <button
            onClick={() => navigate('/projects/new')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            + New Project
          </button>
        </div>

        {summary.recent_uploads.length === 0 ? (
          <div
            style={{
              padding: '48px',
              textAlign: 'center',
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
              color: '#666',
            }}
          >
            No uploads yet. Create a project to get started.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '16px',
            }}
          >
            {summary.recent_uploads.map((upload) => (
              <UploadSummaryCard key={upload.upload_id} summary={upload} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
