/**
 * Calibration input modal for distance and unit
 */
import React, { useState } from 'react'
import { RealUnit } from '../types'

interface CalibrationModalProps {
  onSubmit: (distance: number, unit: RealUnit) => void
  onCancel: () => void
}

export const CalibrationModal: React.FC<CalibrationModalProps> = ({
  onSubmit,
  onCancel,
}) => {
  const [distance, setDistance] = useState('')
  const [unit, setUnit] = useState<RealUnit>(RealUnit.FT)

  const handleSubmit = () => {
    const distanceNum = parseFloat(distance)
    if (isNaN(distanceNum) || distanceNum <= 0) {
      alert('Please enter a valid distance greater than 0')
      return
    }
    onSubmit(distanceNum, unit)
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCancel()
        }
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '32px',
          borderRadius: '8px',
          maxWidth: '400px',
          width: '90%',
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: '24px' }}>Enter Real Distance</h2>

        <div style={{ marginBottom: '16px' }}>
          <label
            htmlFor="distance"
            style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              fontSize: '14px',
            }}
          >
            Distance:
          </label>
          <input
            id="distance"
            type="number"
            step="0.01"
            min="0"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            placeholder="e.g., 10"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              border: '2px solid #e0e0e0',
              borderRadius: '4px',
              boxSizing: 'border-box',
            }}
            autoFocus
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label
            htmlFor="unit"
            style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              fontSize: '14px',
            }}
          >
            Unit:
          </label>
          <select
            id="unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value as RealUnit)}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              border: '2px solid #e0e0e0',
              borderRadius: '4px',
              boxSizing: 'border-box',
            }}
          >
            <option value={RealUnit.FT}>Feet (FT)</option>
            <option value={RealUnit.IN}>Inches (IN)</option>
            <option value={RealUnit.MM}>Millimeters (MM)</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              border: '2px solid #e0e0e0',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: '#2196F3',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Save Calibration
          </button>
        </div>
      </div>
    </div>
  )
}
