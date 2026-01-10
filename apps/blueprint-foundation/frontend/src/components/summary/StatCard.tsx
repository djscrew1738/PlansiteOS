/**
 * Reusable statistics card component
 */
import React from 'react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: string
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'gray'
}

const colorMap = {
  blue: { bg: '#e3f2fd', text: '#1565c0', border: '#2196f3' },
  green: { bg: '#e8f5e9', text: '#2e7d32', border: '#4caf50' },
  yellow: { bg: '#fff8e1', text: '#f57f17', border: '#ffc107' },
  red: { bg: '#ffebee', text: '#c62828', border: '#f44336' },
  gray: { bg: '#f5f5f5', text: '#616161', border: '#9e9e9e' },
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = 'blue',
}) => {
  const colors = colorMap[color]

  return (
    <div
      style={{
        backgroundColor: colors.bg,
        borderLeft: `4px solid ${colors.border}`,
        borderRadius: '8px',
        padding: '20px',
        minWidth: '180px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {icon && <span style={{ fontSize: '24px' }}>{icon}</span>}
        <div>
          <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>
            {title}
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: colors.text }}>
            {value}
          </div>
          {subtitle && (
            <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
