/**
 * Thumbnail grid component for displaying processed pages
 */
import React from 'react'
import { Page } from '../types'
import { apiClient } from '../api/client'

interface ThumbnailGridProps {
  pages: Page[]
  onPageClick: (page: Page) => void
  selectedPageId?: string
}

export const ThumbnailGrid: React.FC<ThumbnailGridProps> = ({
  pages,
  onPageClick,
  selectedPageId,
}) => {
  if (pages.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
        No pages available
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: '16px',
        padding: '16px',
      }}
    >
      {pages.map((page) => (
        <div
          key={page.id}
          onClick={() => onPageClick(page)}
          style={{
            cursor: 'pointer',
            border: selectedPageId === page.id ? '3px solid #2196F3' : '2px solid #e0e0e0',
            borderRadius: '8px',
            padding: '8px',
            backgroundColor: 'white',
            transition: 'all 0.2s',
            boxShadow: selectedPageId === page.id ? '0 4px 8px rgba(0,0,0,0.2)' : '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <div
            style={{
              aspectRatio: '1',
              backgroundColor: '#f5f5f5',
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: '8px',
            }}
          >
            {page.storage_key_page_thumb ? (
              <img
                src={apiClient.getPageThumbUrl(page.id)}
                alt={`Page ${page.page_number}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#999',
                }}
              >
                No thumb
              </div>
            )}
          </div>
          <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: 'bold' }}>
            Page {page.page_number}
          </div>
          {page.warnings && page.warnings.length > 0 && (
            <div style={{ textAlign: 'center', fontSize: '12px', color: '#F44336', marginTop: '4px' }}>
              ⚠ {page.warnings.length} warning(s)
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
