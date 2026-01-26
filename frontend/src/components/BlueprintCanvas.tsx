/**
 * Interactive Blueprint Canvas with Konva
 * Features: Zoom, Pan, Layers, Annotations, Measurements
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage, Line, Text, Circle, Rect, Group } from 'react-konva';
import {
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  ArrowsPointingOutIcon,
  Squares2X2Icon,
  WrenchScrewdriverIcon,
  RulerIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import Button from './ui/Button';

interface BlueprintCanvasProps {
  imageUrl: string;
  width?: number;
  height?: number;
  fixtures?: Array<{
    id: string;
    type: string;
    x: number;
    y: number;
    confidence: number;
  }>;
  onAnnotationAdd?: (annotation: any) => void;
}

type Tool = 'select' | 'measure' | 'annotate' | 'fixture';
type Layer = 'image' | 'fixtures' | 'walls' | 'measurements' | 'annotations';

interface MeasurementPoint {
  x: number;
  y: number;
}

export default function BlueprintCanvas({
  imageUrl,
  width = 1200,
  height = 800,
  fixtures = [],
  onAnnotationAdd,
}: BlueprintCanvasProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [selectedTool, setSelectedTool] = useState<Tool>('select');
  const [activeLayers, setActiveLayers] = useState<Set<Layer>>(
    new Set(['image', 'fixtures', 'measurements'])
  );
  const [measurementPoints, setMeasurementPoints] = useState<MeasurementPoint[]>([]);
  const [annotations, setAnnotations] = useState<Array<{ x: number; y: number; text: string }>>([]);
  const [isDragging, setIsDragging] = useState(false);

  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load blueprint image
  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      setImage(img);
      // Fit image to container
      const scaleX = (width * 0.9) / img.width;
      const scaleY = (height * 0.9) / img.height;
      const initialScale = Math.min(scaleX, scaleY, 1);
      setScale(initialScale);
      setPosition({
        x: (width - img.width * initialScale) / 2,
        y: (height - img.height * initialScale) / 2,
      });
    };
  }, [imageUrl, width, height]);

  // Zoom with mouse wheel
  const handleWheel = useCallback((e: any) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = scale;
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - position.x) / oldScale,
      y: (pointer.y - position.y) / oldScale,
    };

    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = direction > 0 ? oldScale * 1.1 : oldScale / 1.1;
    const limitedScale = Math.max(0.1, Math.min(10, newScale));

    setScale(limitedScale);
    setPosition({
      x: pointer.x - mousePointTo.x * limitedScale,
      y: pointer.y - mousePointTo.y * limitedScale,
    });
  }, [scale, position]);

  // Handle stage click for tools
  const handleStageClick = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    const imageX = (pointer.x - position.x) / scale;
    const imageY = (pointer.y - position.y) / scale;

    if (selectedTool === 'measure') {
      setMeasurementPoints(prev => [...prev, { x: imageX, y: imageY }]);
    } else if (selectedTool === 'annotate') {
      const text = prompt('Enter annotation:');
      if (text) {
        const newAnnotation = { x: imageX, y: imageY, text };
        setAnnotations(prev => [...prev, newAnnotation]);
        onAnnotationAdd?.(newAnnotation);
      }
    }
  }, [selectedTool, position, scale, onAnnotationAdd]);

  // Pan on drag
  const handleDragMove = useCallback((e: any) => {
    if (selectedTool === 'select') {
      setPosition({
        x: e.target.x(),
        y: e.target.y(),
      });
    }
  }, [selectedTool]);

  // Zoom controls
  const zoomIn = () => setScale(prev => Math.min(prev * 1.2, 10));
  const zoomOut = () => setScale(prev => Math.max(prev / 1.2, 0.1));
  const resetView = () => {
    if (!image) return;
    const scaleX = (width * 0.9) / image.width;
    const scaleY = (height * 0.9) / image.height;
    const initialScale = Math.min(scaleX, scaleY, 1);
    setScale(initialScale);
    setPosition({
      x: (width - image.width * initialScale) / 2,
      y: (height - image.height * initialScale) / 2,
    });
  };

  // Toggle layer visibility
  const toggleLayer = (layer: Layer) => {
    setActiveLayers(prev => {
      const next = new Set(prev);
      if (next.has(layer)) {
        next.delete(layer);
      } else {
        next.add(layer);
      }
      return next;
    });
  };

  // Clear measurements
  const clearMeasurements = () => setMeasurementPoints([]);

  return (
    <div className="relative" ref={containerRef}>
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-10 bg-slate-800/90 backdrop-blur rounded-lg shadow-lg p-2 space-y-2">
        {/* Zoom Controls */}
        <div className="flex flex-col gap-1 pb-2 border-b border-slate-700">
          <Button
            variant="ghost"
            size="sm"
            onClick={zoomIn}
            title="Zoom In"
          >
            <MagnifyingGlassPlusIcon className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={zoomOut}
            title="Zoom Out"
          >
            <MagnifyingGlassMinusIcon className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetView}
            title="Reset View"
          >
            <ArrowsPointingOutIcon className="w-5 h-5" />
          </Button>
        </div>

        {/* Tool Selection */}
        <div className="flex flex-col gap-1 pb-2 border-b border-slate-700">
          <Button
            variant={selectedTool === 'select' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setSelectedTool('select')}
            title="Select / Pan"
          >
            <ArrowsPointingOutIcon className="w-5 h-5" />
          </Button>
          <Button
            variant={selectedTool === 'measure' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setSelectedTool('measure')}
            title="Measure"
          >
            <RulerIcon className="w-5 h-5" />
          </Button>
          <Button
            variant={selectedTool === 'annotate' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setSelectedTool('annotate')}
            title="Annotate"
          >
            <PencilIcon className="w-5 h-5" />
          </Button>
        </div>

        {/* Clear Measurements */}
        {measurementPoints.length > 0 && (
          <Button
            variant="danger"
            size="sm"
            onClick={clearMeasurements}
            title="Clear Measurements"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Layer Controls */}
      <div className="absolute top-4 right-4 z-10 bg-slate-800/90 backdrop-blur rounded-lg shadow-lg p-3 space-y-2">
        <h3 className="text-xs font-medium text-slate-300 mb-2">Layers</h3>
        {(['fixtures', 'walls', 'measurements', 'annotations'] as Layer[]).map(layer => (
          <label key={layer} className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={activeLayers.has(layer)}
              onChange={() => toggleLayer(layer)}
              className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-slate-300 capitalize">{layer}</span>
          </label>
        ))}
      </div>

      {/* Scale Indicator */}
      <div className="absolute bottom-4 left-4 z-10 bg-slate-800/90 backdrop-blur rounded-lg shadow-lg px-3 py-2">
        <span className="text-xs text-slate-300">
          {(scale * 100).toFixed(0)}%
        </span>
      </div>

      {/* Info Panel */}
      <div className="absolute bottom-4 right-4 z-10 bg-slate-800/90 backdrop-blur rounded-lg shadow-lg px-3 py-2 text-xs text-slate-300">
        <div>Tool: <span className="text-blue-400 capitalize">{selectedTool}</span></div>
        {measurementPoints.length > 0 && (
          <div>Points: <span className="text-green-400">{measurementPoints.length}</span></div>
        )}
      </div>

      {/* Konva Stage */}
      <div className="bg-slate-900 rounded-lg overflow-hidden shadow-xl border border-slate-800">
        <Stage
          ref={stageRef}
          width={width}
          height={height}
          onWheel={handleWheel}
          onClick={handleStageClick}
          draggable={selectedTool === 'select'}
          onDragEnd={handleDragMove}
        >
          {/* Blueprint Image Layer */}
          {activeLayers.has('image') && (
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
            </Layer>
          )}

          {/* Fixtures Layer */}
          {activeLayers.has('fixtures') && fixtures.length > 0 && (
            <Layer>
              {fixtures.map((fixture) => (
                <Group key={fixture.id}>
                  <Circle
                    x={position.x + fixture.x * scale}
                    y={position.y + fixture.y * scale}
                    radius={8}
                    fill="rgba(59, 130, 246, 0.3)"
                    stroke="#3b82f6"
                    strokeWidth={2}
                  />
                  <Text
                    x={position.x + fixture.x * scale + 12}
                    y={position.y + fixture.y * scale - 6}
                    text={`${fixture.type} (${Math.round(fixture.confidence * 100)}%)`}
                    fontSize={12}
                    fill="#93c5fd"
                    padding={4}
                  />
                </Group>
              ))}
            </Layer>
          )}

          {/* Measurements Layer */}
          {activeLayers.has('measurements') && measurementPoints.length > 0 && (
            <Layer>
              {measurementPoints.map((point, i) => (
                <Circle
                  key={i}
                  x={position.x + point.x * scale}
                  y={position.y + point.y * scale}
                  radius={5}
                  fill="#10b981"
                  stroke="#059669"
                  strokeWidth={2}
                />
              ))}
              {measurementPoints.length >= 2 && (
                <Line
                  points={measurementPoints.flatMap(p => [
                    position.x + p.x * scale,
                    position.y + p.y * scale,
                  ])}
                  stroke="#10b981"
                  strokeWidth={2}
                  dash={[10, 5]}
                />
              )}
            </Layer>
          )}

          {/* Annotations Layer */}
          {activeLayers.has('annotations') && annotations.length > 0 && (
            <Layer>
              {annotations.map((annotation, i) => (
                <Group key={i}>
                  <Rect
                    x={position.x + annotation.x * scale}
                    y={position.y + annotation.y * scale}
                    width={150}
                    height={30}
                    fill="rgba(251, 191, 36, 0.9)"
                    cornerRadius={4}
                  />
                  <Text
                    x={position.x + annotation.x * scale + 8}
                    y={position.y + annotation.y * scale + 8}
                    text={annotation.text}
                    fontSize={14}
                    fill="#78350f"
                    width={134}
                  />
                </Group>
              ))}
            </Layer>
          )}
        </Stage>
      </div>
    </div>
  );
}
