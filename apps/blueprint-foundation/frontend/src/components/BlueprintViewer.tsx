/**
 * Blueprint viewer with zoom, pan, and calibration using Konva
 */
import React, { useState, useEffect, useRef } from 'react'
import { Stage, Layer, Image as KonvaImage, Line, Text, Circle } from 'react-konva'
import { Page, Calibration, RealUnit, CalibrationCreate } from '../types'
import { apiClient } from '../api/client'
import { CalibrationModal } from './CalibrationModal'

interface BlueprintViewerProps {
  page: Page
  containerWidth: number
  containerHeight: number
}

interface CalibrationPoints {
  p1?: { x: number; y: number }
  p2?: { x: number; y: number }
}

export const BlueprintViewer: React.FC<BlueprintViewerProps> = ({
  page,
  containerWidth,
  containerHeight,
}) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [calibrationMode, setCalibrationMode] = useState(false)
  const [calibrationPoints, setCalibrationPoints] = useState<CalibrationPoints>({})
  const [showCalibrationModal, setShowCalibrationModal] = useState(false)
  const [calibration, setCalibration] = useState<Calibration | null>(null)
  const stageRef = useRef<any>(null)

  // Load image
  useEffect(() => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.src = apiClient.getPageImageUrl(page.id)
    img.onload = () => {
      setImage(img)
      // Fit image to container
      const scaleX = containerWidth / img.width
      const scaleY = containerHeight / img.height
      const initialScale = Math.min(scaleX, scaleY, 1) * 0.9
      setScale(initialScale)
      setPosition({
        x: (containerWidth - img.width * initialScale) / 2,
        y: (containerHeight - img.height * initialScale) / 2,
      })
    }
  }, [page.id, containerWidth, containerHeight])

  // Load existing calibration
  useEffect(() => {
    const loadCalibration = async () => {
      try {
        const cal = await apiClient.getCalibration(page.id)
        setCalibration(cal)
      } catch (error) {
        console.error('Failed to load calibration:', error)
      }
    }
    loadCalibration()
  }, [page.id])

  const handleWheel = (e: any) => {
    e.evt.preventDefault()

    const stage = stageRef.current
    if (!stage) return

    const oldScale = scale
    const pointer = stage.getPointerPosition()

    const mousePointTo = {
      x: (pointer.x - position.x) / oldScale,
      y: (pointer.y - position.y) / oldScale,
    }

    const direction = e.evt.deltaY > 0 ? -1 : 1
    const newScale = direction > 0 ? oldScale * 1.1 : oldScale / 1.1

    // Limit scale
    const limitedScale = Math.max(0.1, Math.min(10, newScale))

    setScale(limitedScale)
    setPosition({
      x: pointer.x - mousePointTo.x * limitedScale,
      y: pointer.y - mousePointTo.y * limitedScale,
    })
  }

  const handleStageClick = (e: any) => {
    if (!calibrationMode) return

    const stage = stageRef.current
    if (!stage) return

    const pointer = stage.getPointerPosition()

    // Convert to image coordinates
    const imageX = (pointer.x - position.x) / scale
    const imageY = (pointer.y - position.y) / scale

    if (!calibrationPoints.p1) {
      setCalibrationPoints({ p1: { x: imageX, y: imageY } })
    } else if (!calibrationPoints.p2) {
      setCalibrationPoints({
        ...calibrationPoints,
        p2: { x: imageX, y: imageY },
      })
      setShowCalibrationModal(true)
    }
  }

  const handleCalibrationSubmit = async (distance: number, unit: RealUnit) => {
    if (!calibrationPoints.p1 || !calibrationPoints.p2) return

    try {
      const calibrationData: CalibrationCreate = {
        p1x: Math.round(calibrationPoints.p1.x),
        p1y: Math.round(calibrationPoints.p1.y),
        p2x: Math.round(calibrationPoints.p2.x),
        p2y: Math.round(calibrationPoints.p2.y),
        real_distance: distance,
        real_unit: unit,
      }

      const newCalibration = await apiClient.createCalibration(page.id, calibrationData)
      setCalibration(newCalibration)
      setCalibrationMode(false)
      setCalibrationPoints({})
      setShowCalibrationModal(false)
      alert('Calibration saved successfully!')
    } catch (error) {
      console.error('Failed to save calibration:', error)
      alert('Failed to save calibration')
    }
  }

  const handleCalibrationCancel = () => {
    setShowCalibrationModal(false)
    setCalibrationPoints({})
  }

  const toggleCalibrationMode = () => {
    setCalibrationMode(!calibrationMode)
    setCalibrationPoints({})
  }

  const renderCalibrationOverlay = () => {
    const points: { x: number; y: number }[] = []

    if (calibrationPoints.p1) {
      points.push({
        x: calibrationPoints.p1.x * scale + position.x,
        y: calibrationPoints.p1.y * scale + position.y,
      })
    }

    if (calibrationPoints.p2) {
      points.push({
        x: calibrationPoints.p2.x * scale + position.x,
        y: calibrationPoints.p2.y * scale + position.y,
      })
    }

    return (
      <>
        {points.map((point, index) => (
          <Circle
            key={index}
            x={point.x}
            y={point.y}
            radius={8}
            fill="red"
            stroke="white"
            strokeWidth={2}
          />
        ))}
        {points.length === 2 && (
          <Line
            points={[points[0].x, points[0].y, points[1].x, points[1].y]}
            stroke="red"
            strokeWidth={3}
            dash={[10, 5]}
          />
        )}
      </>
    )
  }

  const renderExistingCalibration = () => {
    if (!calibration) return null

    const p1 = {
      x: calibration.p1x * scale + position.x,
      y: calibration.p1y * scale + position.y,
    }
    const p2 = {
      x: calibration.p2x * scale + position.x,
      y: calibration.p2y * scale + position.y,
    }

    return (
      <>
        <Circle x={p1.x} y={p1.y} radius={6} fill="green" stroke="white" strokeWidth={2} />
        <Circle x={p2.x} y={p2.y} radius={6} fill="green" stroke="white" strokeWidth={2} />
        <Line
          points={[p1.x, p1.y, p2.x, p2.y]}
          stroke="green"
          strokeWidth={2}
        />
        <Text
          x={(p1.x + p2.x) / 2}
          y={(p1.y + p2.y) / 2 - 20}
          text={`Scale: ${calibration.pixels_per_unit.toFixed(2)} px/${calibration.real_unit}`}
          fontSize={14}
          fill="green"
          fontStyle="bold"
          shadowColor="white"
          shadowBlur={5}
          shadowOffsetX={0}
          shadowOffsetY={0}
        />
      </>
    )
  }

  return (
    <div style={{ position: 'relative', width: containerWidth, height: containerHeight }}>
      {/* Controls */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <button
          onClick={toggleCalibrationMode}
          style={{
            padding: '12px 16px',
            fontSize: '14px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: calibrationMode ? '#F44336' : '#2196F3',
            color: 'white',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          {calibrationMode ? 'Cancel Calibration' : 'Calibrate Scale'}
        </button>
        {calibration && !calibrationMode && (
          <div
            style={{
              padding: '12px',
              backgroundColor: 'rgba(76, 175, 80, 0.9)',
              color: 'white',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
          >
            Calibrated: {calibration.real_distance} {calibration.real_unit}
          </div>
        )}
      </div>

      {/* Info overlay */}
      {calibrationMode && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            zIndex: 10,
            padding: '12px',
            backgroundColor: 'rgba(33, 150, 243, 0.9)',
            color: 'white',
            borderRadius: '4px',
            fontSize: '14px',
          }}
        >
          {!calibrationPoints.p1
            ? 'Click point A on the blueprint'
            : !calibrationPoints.p2
            ? 'Click point B on the blueprint'
            : 'Enter distance'}
        </div>
      )}

      {/* Konva Stage */}
      <Stage
        width={containerWidth}
        height={containerHeight}
        scaleX={1}
        scaleY={1}
        draggable={!calibrationMode}
        onWheel={handleWheel}
        onClick={handleStageClick}
        ref={stageRef}
        style={{ cursor: calibrationMode ? 'crosshair' : 'grab' }}
      >
        <Layer>
          {image && (
            <KonvaImage
              image={image}
              x={position.x}
              y={position.y}
              scaleX={scale}
              scaleY={scale}
            />
          )}
          {calibrationMode && renderCalibrationOverlay()}
          {!calibrationMode && renderExistingCalibration()}
        </Layer>
      </Stage>

      {/* Calibration Modal */}
      {showCalibrationModal && (
        <CalibrationModal
          onSubmit={handleCalibrationSubmit}
          onCancel={handleCalibrationCancel}
        />
      )}
    </div>
  )
}
