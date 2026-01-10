/**
 * Quality grade badge component
 */
import React from 'react'
import { QualityGrade } from '../../types/summary'

interface QualityBadgeProps {
  grade: QualityGrade
  score?: number
  size?: 'small' | 'medium' | 'large'
}

const gradeConfig = {
  [QualityGrade.EXCELLENT]: { color: '#2e7d32', bg: '#e8f5e9', label: 'Excellent' },
  [QualityGrade.GOOD]: { color: '#1565c0', bg: '#e3f2fd', label: 'Good' },
  [QualityGrade.FAIR]: { color: '#f57f17', bg: '#fff8e1', label: 'Fair' },
  [QualityGrade.POOR]: { color: '#c62828', bg: '#ffebee', label: 'Poor' },
}

const sizeConfig = {
  small: { padding: '4px 8px', fontSize: '11px' },
  medium: { padding: '6px 12px', fontSize: '13px' },
  large: { padding: '8px 16px', fontSize: '15px' },
}

export const QualityBadge: React.FC<QualityBadgeProps> = ({
  grade,
  score,
  size = 'medium',
}) => {
  const config = gradeConfig[grade]
  const sizeStyles = sizeConfig[size]

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: config.bg,
        color: config.color,
        borderRadius: '4px',
        fontWeight: 'bold',
        ...sizeStyles,
      }}
    >
      <span>{config.label}</span>
      {score !== undefined && (
        <span style={{ opacity: 0.8 }}>({score}%)</span>
      )}
    </div>
  )
}
