/**
 * File upload drag-and-drop zone component
 */
import React, { useCallback, useState } from 'react'

interface UploadZoneProps {
  onFileSelect: (file: File) => void
  disabled?: boolean
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFileSelect, disabled }) => {
  const [isDragging, setIsDragging] = useState(false)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }, [])

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (disabled) return

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0]
        onFileSelect(file)
      }
    },
    [disabled, onFileSelect]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return

      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0]
        onFileSelect(file)
      }
    },
    [disabled, onFileSelect]
  )

  return (
    <div
      style={{
        border: isDragging ? '3px dashed #4CAF50' : '2px dashed #ccc',
        borderRadius: '8px',
        padding: '40px',
        textAlign: 'center',
        backgroundColor: isDragging ? '#f0f8f0' : '#fafafa',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.3s',
        opacity: disabled ? 0.6 : 1,
      }}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="file-upload"
        accept=".pdf,.png,.jpg,.jpeg,.heic"
        onChange={handleFileInput}
        disabled={disabled}
        style={{ display: 'none' }}
      />
      <label
        htmlFor="file-upload"
        style={{
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: '16px',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
          {isDragging ? 'Drop file here' : 'Drag & drop blueprint file'}
        </div>
        <div style={{ color: '#666', fontSize: '14px' }}>
          or click to browse
        </div>
        <div style={{ color: '#999', fontSize: '12px', marginTop: '8px' }}>
          Supports PDF, PNG, JPG, JPEG, HEIC
        </div>
      </label>
    </div>
  )
}
