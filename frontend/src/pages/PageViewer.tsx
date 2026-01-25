import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layer, Line, Stage, Text, Image as KonvaImage } from 'react-konva';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { ArrowLeftIcon, ArrowsPointingOutIcon, ViewfinderCircleIcon } from '@heroicons/react/24/outline';
import { useUpload, useCalibration, useSetCalibration } from '../hooks/useApi';
import { pagesApi } from '../lib/api';
import type { Page, RealUnit } from '../types/api';

// Custom hook to load image
function useImage(url: string) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = url;
    img.onload = () => {
      setImage(img);
      setLoading(false);
    };
    img.onerror = () => {
      setError('Failed to load image');
      setLoading(false);
    };
  }, [url]);

  return { image, loading, error };
}

export default function PageViewer() {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  // State
  const [activePage, setActivePage] = useState<Page | null>(null);
  const [mode, setMode] = useState<'view' | 'calibrate'>('view');
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [distance, setDistance] = useState('');
  const [unit, setUnit] = useState<RealUnit>('FT');
  const [scale, setScale] = useState(1);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get upload ID from localStorage
  const uploadId = localStorage.getItem('currentUploadId') || '';

  // API Hooks
  const { data: upload } = useUpload(uploadId);
  const { data: calibration, refetch: refetchCalibration } = useCalibration(pageId || '');
  const setCalibrationMutation = useSetCalibration();

  // Set active page from upload data
  useEffect(() => {
    if (upload && pageId) {
      const page = upload.pages.find((p) => p.id === pageId) || upload.pages[0];
      setActivePage(page);
    }
  }, [upload, pageId]);

  // Load page image
  const { image, loading: imageLoading } = useImage(
    activePage ? pagesApi.imageUrl(activePage.id) : ''
  );

  // Handle window resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setStageSize({ width: rect.width, height: rect.height });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Wheel zoom handler
  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = direction > 0 ? oldScale * 1.1 : oldScale * 0.9;
    const clampedScale = Math.min(Math.max(newScale, 0.1), 10);

    setScale(clampedScale);
    stage.scale({ x: clampedScale, y: clampedScale });

    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    };
    stage.position(newPos);
  };

  // Stage click handler for calibration
  const onStageClick = (e: any) => {
    if (mode !== 'calibrate') return;
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (!pos) return;

    // Convert screen position to image position (accounting for zoom/pan)
    const transform = stage.getAbsoluteTransform().copy().invert();
    const point = transform.point(pos);

    const newPoints = [...points, { x: point.x, y: point.y }];
    setPoints(newPoints);

    if (newPoints.length === 2) {
      setShowModal(true);
    }
  };

  // Save calibration
  const saveCalibration = async () => {
    if (!pageId || points.length < 2 || !distance) {
      toast.error('Invalid calibration', 'Please enter a valid distance');
      return;
    }

    try {
      await setCalibrationMutation.mutateAsync({
        pageId,
        data: {
          p1x: Math.round(points[0].x),
          p1y: Math.round(points[0].y),
          p2x: Math.round(points[1].x),
          p2y: Math.round(points[1].y),
          realDistance: Number(distance),
          realUnit: unit,
        },
      });
      toast.success('Calibration saved', `Scale: ${distance} ${unit.toLowerCase()}`);
      refetchCalibration();
      resetCalibration();
    } catch (err) {
      toast.error('Failed to save calibration', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const resetCalibration = () => {
    setMode('view');
    setPoints([]);
    setShowModal(false);
    setDistance('');
  };

  const resetZoom = () => {
    if (stageRef.current) {
      setScale(1);
      stageRef.current.scale({ x: 1, y: 1 });
      stageRef.current.position({ x: 0, y: 0 });
    }
  };

  if (!upload || !activePage) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-400">Loading viewer...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-4">
      {/* Header */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <Button variant="ghost" onClick={() => navigate(`/uploads/${uploadId}`)}>
          <ArrowLeftIcon className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-slate-100">Page {activePage.pageNumber}</h1>
          <p className="text-xs text-slate-400">
            {activePage.widthPx} x {activePage.heightPx} px
            {activePage.dpiEstimated && ` • ${activePage.dpiEstimated} DPI`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {calibration && (
            <Badge variant="green">
              {calibration.pixelsPerUnit.toFixed(1)} px/{calibration.realUnit.toLowerCase()}
            </Badge>
          )}
          <Button
            variant={mode === 'calibrate' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => {
              if (mode === 'calibrate') {
                resetCalibration();
              } else {
                setMode('calibrate');
                toast.info('Calibration mode', 'Click two points to set the scale');
              }
            }}
          >
            <ViewfinderCircleIcon className="w-4 h-4 mr-2" />
            {mode === 'calibrate' ? 'Cancel' : 'Calibrate'}
          </Button>
          <Button variant="ghost" size="sm" onClick={resetZoom}>
            <ArrowsPointingOutIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Page Thumbnails Sidebar */}
        <div className="w-24 flex-shrink-0 overflow-y-auto space-y-2">
          {upload.pages.map((page) => (
            <button
              key={page.id}
              onClick={() => {
                setActivePage(page);
                navigate(`/pages/${page.id}`, { replace: true });
                resetCalibration();
              }}
              className={`relative w-full aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                page.id === activePage.id
                  ? 'border-blue-500'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              <img
                src={pagesApi.thumbUrl(page.id)}
                alt={`Page ${page.pageNumber}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-black/60 py-0.5">
                <p className="text-xs text-white text-center">{page.pageNumber}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Canvas Viewer */}
        <Card className="flex-1 p-0 overflow-hidden" ref={containerRef}>
          {imageLoading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-400">Loading image...</p>
            </div>
          ) : (
            <Stage
              width={stageSize.width}
              height={stageSize.height}
              draggable
              onWheel={handleWheel}
              onClick={onStageClick}
              ref={stageRef}
              scaleX={scale}
              scaleY={scale}
              style={{ cursor: mode === 'calibrate' ? 'crosshair' : 'grab' }}
            >
              <Layer>
                {image && <KonvaImage image={image} />}

                {/* Calibration line while drawing */}
                {points.length === 1 && (
                  <Line
                    points={[points[0].x, points[0].y, points[0].x + 10, points[0].y]}
                    stroke="#3b82f6"
                    strokeWidth={2 / scale}
                    dash={[5 / scale, 5 / scale]}
                  />
                )}

                {/* Calibration line (two points) */}
                {points.length === 2 && (
                  <>
                    <Line
                      points={[points[0].x, points[0].y, points[1].x, points[1].y]}
                      stroke="#3b82f6"
                      strokeWidth={3 / scale}
                    />
                    {/* Point markers */}
                    {points.map((p, i) => (
                      <Line
                        key={i}
                        points={[p.x - 10 / scale, p.y, p.x + 10 / scale, p.y]}
                        stroke="#3b82f6"
                        strokeWidth={2 / scale}
                      />
                    ))}
                  </>
                )}

                {/* Existing calibration display */}
                {calibration && mode === 'view' && (
                  <Text
                    text={`Scale: ${calibration.pixelsPerUnit.toFixed(2)} px/${calibration.realUnit.toLowerCase()}`}
                    x={20}
                    y={20}
                    fill="#3b82f6"
                    fontSize={16 / scale}
                  />
                )}
              </Layer>
            </Stage>
          )}
        </Card>
      </div>

      {/* Mode indicator */}
      {mode === 'calibrate' && (
        <Card className="border-blue-500/50 bg-blue-500/10 py-2 flex-shrink-0">
          <p className="text-sm text-blue-300 text-center">
            {points.length === 0
              ? 'Click the first point on a known measurement'
              : 'Click the second point to complete the measurement'}
          </p>
        </Card>
      )}

      {/* Calibration Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setPoints([]);
        }}
        title="Enter Real Distance"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Enter the actual distance between the two points you selected.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Distance</label>
              <Input
                type="number"
                placeholder="e.g., 10"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Unit</label>
              <Select value={unit} onChange={(e) => setUnit(e.target.value as RealUnit)}>
                <option value="FT">Feet</option>
                <option value="IN">Inches</option>
                <option value="MM">Millimeters</option>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={() => {
                setShowModal(false);
                setPoints([]);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={saveCalibration}
              disabled={!distance || setCalibrationMutation.isPending}
            >
              {setCalibrationMutation.isPending ? 'Saving...' : 'Save Calibration'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
