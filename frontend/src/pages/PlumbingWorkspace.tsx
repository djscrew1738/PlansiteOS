import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Image as KonvaImage, Layer, Line, Stage, Text } from 'react-konva';
import {
  createPipeline,
  createSegment,
  deletePipeline,
  deleteSegment,
  getCalibration,
  getUpload,
  listPipelines,
  listSegments,
  pageImageUrl,
} from '../components/api';

const SYSTEMS = [
  { value: 'WATER_COLD', label: 'Water - Cold' },
  { value: 'WATER_HOT', label: 'Water - Hot' },
  { value: 'SEWER', label: 'Sewer' },
  { value: 'VENT', label: 'Vent' },
  { value: 'GAS', label: 'Gas' },
];

const PHASES = [
  { value: 'UNDERGROUND', label: 'Underground' },
  { value: 'TOP_OUT', label: 'Top-Out' },
  { value: 'TRIM', label: 'Trim' },
];

export default function PlumbingWorkspace() {
  const { projectId } = useParams();
  const [upload, setUpload] = useState<any>(null);
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [activePipeline, setActivePipeline] = useState<any | null>(null);
  const [segments, setSegments] = useState<any[]>([]);
  const [pipelineForm, setPipelineForm] = useState({
    systemType: 'WATER_COLD',
    name: 'Water - Cold',
    phase: 'UNDERGROUND',
  });
  const [segmentForm, setSegmentForm] = useState({
    diameter: '3/4',
    material: 'PEX',
    phase: 'UNDERGROUND',
  });
  const [draftPoints, setDraftPoints] = useState<number[]>([]);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [calibration, setCalibration] = useState<any>(null);
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [stageSize, setStageSize] = useState({ width: 900, height: 600 });
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const uploadId = localStorage.getItem('currentUploadId');
    if (!uploadId) return;
    getUpload(uploadId).then((data) => {
      setUpload(data);
      if (data.pages?.[0]) {
        listPipelines(data.pages[0].id).then(setPipelines);
      }
    });
  }, []);

  const activePageId = upload?.pages?.[0]?.id;
  const pageImage = useMemo(() => (activePageId ? pageImageUrl(activePageId) : ''), [activePageId]);
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!pageImage) return;
    const img = new window.Image();
    img.src = pageImage;
    img.onload = () => setImage(img);
  }, [pageImage]);

  useEffect(() => {
    if (!activePageId) return;
    getCalibration(activePageId).then((data) => setCalibration(data));
  }, [activePageId]);

  useEffect(() => {
    if (!activePipeline) return;
    listSegments(activePipeline.id).then(setSegments);
  }, [activePipeline]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setStageSize({
          width: Math.max(300, entry.contentRect.width),
          height: Math.max(300, entry.contentRect.height),
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const addPipeline = async () => {
    if (!projectId || !activePageId) return;
    const payload = {
      projectId,
      pageId: activePageId,
      systemType: pipelineForm.systemType,
      name: pipelineForm.name,
      phase: pipelineForm.phase,
    };
    const created = await createPipeline(payload);
    setPipelines((prev) => [...prev, created]);
    setActivePipeline(created);
  };

  const handleStageClick = (e: any) => {
    if (!activePipeline) return;
    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const snapSize = 10;
    const snapped = snapEnabled
      ? { x: Math.round(pointer.x / snapSize) * snapSize, y: Math.round(pointer.y / snapSize) * snapSize }
      : pointer;
    setDraftPoints((prev) => [...prev, snapped.x, snapped.y]);
  };

  const finalizeSegment = async () => {
    if (!activePipeline || draftPoints.length < 4) return;
    const points: number[][] = [];
    for (let i = 0; i < draftPoints.length; i += 2) {
      points.push([draftPoints[i], draftPoints[i + 1]]);
    }
    const payload = {
      pipelineId: activePipeline.id,
      points,
      diameter: segmentForm.diameter,
      material: segmentForm.material,
      phase: segmentForm.phase,
    };
    const created = await createSegment(payload);
    setSegments((prev) => [...prev, created]);
    setDraftPoints([]);
  };

  const clearDraft = () => setDraftPoints([]);

  const zoomTo = (nextScale: number) => {
    const stage = stageRef.current;
    if (!stage) return;
    setScale(nextScale);
    stage.scale({ x: nextScale, y: nextScale });
  };

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const oldScale = stage.scaleX();
    const newScale = e.evt.deltaY > 0 ? oldScale * 0.9 : oldScale * 1.1;
    zoomTo(Math.max(0.2, Math.min(5, newScale)));
  };

  const deleteActivePipeline = async () => {
    if (!activePipeline) return;
    await deletePipeline(activePipeline.id);
    setPipelines((prev) => prev.filter((pipe) => pipe.id !== activePipeline.id));
    setActivePipeline(null);
    setSegments([]);
  };

  const removeSegment = async (segmentId: string) => {
    await deleteSegment(segmentId);
    setSegments((prev) => prev.filter((segment) => segment.id !== segmentId));
  };

  const pipelineOptions = useMemo(
    () => pipelines.map((pipe) => ({ value: pipe.id, label: pipe.name })),
    [pipelines]
  );

  const totalLengthPx = useMemo(() => {
    const distance = (points: number[][]) => {
      let total = 0;
      for (let i = 1; i < points.length; i += 1) {
        const [x1, y1] = points[i - 1];
        const [x2, y2] = points[i];
        total += Math.hypot(x2 - x1, y2 - y1);
      }
      return total;
    };
    return segments.reduce((sum, seg) => sum + distance(seg.points), 0);
  }, [segments]);

  const totalLengthReal = calibration ? totalLengthPx / calibration.pixelsPerUnit : null;

  return (
    <div className="layout">
      <div className="sidebar">
        <h3>Systems</h3>
        <div className="card">
          <label>System Type</label>
          <select
            className="input"
            value={pipelineForm.systemType}
            onChange={(e) => {
              const systemType = e.target.value;
              const system = SYSTEMS.find((item) => item.value === systemType);
              setPipelineForm((prev) => ({
                ...prev,
                systemType,
                name: system?.label || prev.name,
              }));
            }}
          >
            {SYSTEMS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <label>Name</label>
          <input
            className="input"
            value={pipelineForm.name}
            onChange={(e) => setPipelineForm((prev) => ({ ...prev, name: e.target.value }))}
          />
          <label>Phase</label>
          <select
            className="input"
            value={pipelineForm.phase}
            onChange={(e) => setPipelineForm((prev) => ({ ...prev, phase: e.target.value }))}
          >
            {PHASES.map((phase) => (
              <option key={phase.value} value={phase.value}>
                {phase.label}
              </option>
            ))}
          </select>
          <button className="button" onClick={addPipeline}>Create Pipeline</button>
        </div>
        <div className="card">
          <label>Active Pipeline</label>
          <select
            className="input"
            value={activePipeline?.id || ''}
            onChange={(e) => {
              const pipeline = pipelines.find((pipe) => pipe.id === e.target.value) || null;
              setActivePipeline(pipeline);
            }}
          >
            <option value="">Select pipeline</option>
            {pipelineOptions.map((pipe) => (
              <option key={pipe.value} value={pipe.value}>
                {pipe.label}
              </option>
            ))}
          </select>
          <p>Mode: Pipeline</p>
          <p>Diameter presets: 1/2", 3/4", 1"</p>
        </div>
      </div>
      <div className="viewer-panel">
        <div className="viewer-toolbar card">
          <strong>Plumbing Workspace</strong>
          <span>Pipeline Mode</span>
          <button className="button" onClick={() => zoomTo(Math.min(5, scale * 1.2))}>Zoom In</button>
          <button className="button" onClick={() => zoomTo(Math.max(0.2, scale * 0.8))}>Zoom Out</button>
          <span>Zoom: {(scale * 100).toFixed(0)}%</span>
          <button className="toggle" disabled>Fixture Mode (soon)</button>
          <button className="toggle" disabled>Penetrations (soon)</button>
        </div>
        <div className="viewer" ref={containerRef}>
          <Stage
            width={stageSize.width}
            height={stageSize.height}
            draggable
            ref={stageRef}
            onClick={handleStageClick}
            onDblClick={finalizeSegment}
            onWheel={handleWheel}
          >
            <Layer>
              {image && <KonvaImage image={image} />}
              <Text text="Routing canvas (V3)" x={20} y={20} fontSize={16} fill="#2f6fed" />
              {activePipeline && (
                <Text text={`Active: ${activePipeline.name}`} x={20} y={48} fontSize={12} fill="#6b7a99" />
              )}
              {segments.map((segment) => (
                <Line
                  key={segment.id}
                  points={segment.points.flat()}
                  stroke="#2f6fed"
                  strokeWidth={3}
                />
              ))}
              {draftPoints.length > 0 && (
                <Line points={draftPoints} stroke="#2f6fed" strokeWidth={2} dash={[6, 4]} />
              )}
            </Layer>
          </Stage>
        </div>
      </div>
      <div className="sidebar">
        <h3>Inspector</h3>
        <div className="card">
          <p>Snap to grid</p>
          <label>
            <input
              type="checkbox"
              checked={snapEnabled}
              onChange={(e) => setSnapEnabled(e.target.checked)}
            />{' '}
            Enabled (10px)
          </label>
          <p>Segment diameter</p>
          <select
            className="input"
            value={segmentForm.diameter}
            onChange={(e) => setSegmentForm((prev) => ({ ...prev, diameter: e.target.value }))}
          >
            <option value="1/2">1/2"</option>
            <option value="3/4">3/4"</option>
            <option value="1">1"</option>
          </select>
          <p>Material</p>
          <select
            className="input"
            value={segmentForm.material}
            onChange={(e) => setSegmentForm((prev) => ({ ...prev, material: e.target.value }))}
          >
            <option value="PEX">PEX</option>
            <option value="Copper">Copper</option>
            <option value="PVC">PVC</option>
          </select>
          <p>Phase</p>
          <select
            className="input"
            value={segmentForm.phase}
            onChange={(e) => setSegmentForm((prev) => ({ ...prev, phase: e.target.value }))}
          >
            {PHASES.map((phase) => (
              <option key={phase.value} value={phase.value}>
                {phase.label}
              </option>
            ))}
          </select>
          <button className="button" onClick={finalizeSegment} disabled={draftPoints.length < 4}>
            Save Segment
          </button>
          <button className="button" onClick={clearDraft} disabled={draftPoints.length === 0}>
            Clear Draft
          </button>
          {draftPoints.length > 0 && <p>Click to add points, double click to finish.</p>}
        </div>
        <div className="card">
          <h4>Pipeline Summary</h4>
          <p>Segments: {segments.length}</p>
          <p>Length: {totalLengthPx.toFixed(1)} px</p>
          {totalLengthReal && calibration && (
            <p>
              Length: {totalLengthReal.toFixed(2)} {calibration.realUnit.toLowerCase()}
            </p>
          )}
          <button className="button" onClick={deleteActivePipeline} disabled={!activePipeline}>
            Delete Pipeline
          </button>
        </div>
        <div className="card">
          <h4>Segments</h4>
          {segments.length === 0 && <p>No segments yet.</p>}
          {segments.map((segment) => (
            <div key={segment.id} style={{ marginBottom: '8px' }}>
              <p>{segment.diameter} {segment.material} • {segment.phase}</p>
              <button className="button" onClick={() => removeSegment(segment.id)}>Delete</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
