/**
 * Page viewer with blueprint viewer and calibration
 */
import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Page, Upload } from '../types'
import { BlueprintViewer } from '../components/BlueprintViewer'
import { ThumbnailGrid } from '../components/ThumbnailGrid'

export const PageViewer: React.FC = () => {
  const { pageId } = useParams<{ pageId: string }>()
  const navigate = useNavigate()
  const [page, setPage] = useState<Page | null>(null)
  const [upload] = useState<Upload | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSidebar, setShowSidebar] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const [viewerSize, setViewerSize] = useState({ width: 800, height: 600 })

  useEffect(() => {
    loadPage()
  }, [pageId])

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setViewerSize({ width: rect.width, height: rect.height })
      }
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [showSidebar])

  const loadPage = async () => {
    if (!pageId) return

    try {
      setLoading(true)

      // Note: In a real app, we'd have a getPage endpoint
      // For now, we need to get the upload ID from somewhere
      // This is a limitation of the current API structure
      // We'll load the page details through the upload
      // This requires knowing the upload ID - in a real app,
      // you'd either pass it via state or have a direct page endpoint

      // For demo purposes, let's assume we have the page data
      // You may need to adjust this based on how you navigate to pages
      const response = await fetch(`http://localhost:8000/api/pages/${pageId}/image`)
      if (!response.ok) throw new Error('Page not found')

      // Since we don't have a direct page endpoint, we'll create a minimal page object
      // In production, you'd add GET /api/pages/{pageId} endpoint
      setPage({
        id: pageId,
        upload_id: '',
        page_number: 1,
        width_px: 0,
        height_px: 0,
        storage_key_page_png: '',
        status: 'READY' as any,
        created_at: '',
      })
    } catch (error) {
      console.error('Failed to load page:', error)
      alert('Failed to load page')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div style={{ padding: '24px', textAlign: 'center' }}>Loading...</div>
  }

  if (!page) {
    return <div style={{ padding: '24px', textAlign: 'center' }}>Page not found</div>
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar with thumbnails */}
      {showSidebar && upload && upload.pages && (
        <div
          style={{
            width: '300px',
            height: '100vh',
            overflowY: 'auto',
            borderRight: '2px solid #e0e0e0',
            backgroundColor: '#fafafa',
          }}
        >
          <div style={{ padding: '16px', borderBottom: '2px solid #e0e0e0' }}>
            <button
              onClick={() => navigate(`/uploads/${upload.id}`)}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '14px',
                border: '2px solid #e0e0e0',
                borderRadius: '4px',
                backgroundColor: 'white',
                cursor: 'pointer',
              }}
            >
              ← Back to Upload
            </button>
          </div>
          <ThumbnailGrid
            pages={upload.pages}
            onPageClick={(p) => navigate(`/pages/${p.id}`)}
            selectedPageId={pageId}
          />
        </div>
      )}

      {/* Main viewer */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {/* Toggle sidebar button */}
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            zIndex: 100,
            padding: '12px 16px',
            fontSize: '14px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          {showSidebar ? '◀ Hide' : '▶ Show'} Thumbnails
        </button>

        {/* Viewer container */}
        <div ref={containerRef} style={{ flex: 1, backgroundColor: '#2e2e2e' }}>
          <BlueprintViewer
            page={page}
            containerWidth={viewerSize.width}
            containerHeight={viewerSize.height}
          />
        </div>

        {/* Page info footer */}
        <div
          style={{
            padding: '12px 24px',
            backgroundColor: '#fff',
            borderTop: '2px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: '14px', color: '#666' }}>
            Page {page.page_number}
            {page.dpi_estimated && ` | ${page.dpi_estimated} DPI`}
            {page.width_px && page.height_px && ` | ${page.width_px} × ${page.height_px}px`}
          </div>
          {page.warnings && page.warnings.length > 0 && (
            <div style={{ fontSize: '12px', color: '#F44336' }}>
              ⚠ {page.warnings.length} warning(s)
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
