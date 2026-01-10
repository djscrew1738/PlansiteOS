import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Layer, Line, Stage, Text, Image as KonvaImage } from 'react-konva';
import { getCalibration, getUpload, pageImageUrl, pageThumbUrl, setCalibration } from '../components/api';

function useImage(url: string) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    const img = new window.Image();
    img.src = url;
    img.onload = () => setImage(img);
  }, [url]);
  return image;
}

export default function PageViewer() {
  const { pageId } = useParams();
  const [upload, setUpload] = useState<any>(null);
  const [activePage, setActivePage] = useState<any>(null);
  const [calibration, setCalibrationState] = useState<any>(null);
  const [mode, setMode] = useState<'view' | 'calibrate'>('view');
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [distance, setDistance] = useState('');
  const [unit, setUnit] = useState('FT');
  const stageRef = useRef<any>(null);
  const [scale, setScale] = useState(1);
  const lastDistRef = useRef<number | null>(null);
  const lastCenterRef = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const uploadId = localStorage.getItem('currentUploadId');
    if (!uploadId) return;
    getUpload(uploadId).then((data) => {
      setUpload(data);
      const page = data.pages.find((p: any) => p.id === pageId) || data.pages[0];
      setActivePage(page);
    });
  }, [pageId]);

  useEffect(() => {
    if (!pageId) return;
    getCalibration(pageId).then((data) => {
      setCalibrationState(data);
    });
  }, [pageId]);

  const image = useImage(activePage ? pageImageUrl(activePage.id) : '');
  const imageSize = useMemo(() => {
    if (!image) return { width: 0, height: 0 };
    return { width: image.width, height: image.height };
  }, [image]);

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

  useEffect(() => {
    if (!image || !stageRef.current) return;
    const scaleX = stageSize.width / image.width;
    const scaleY = stageSize.height / image.height;
    const nextScale = Math.min(scaleX, scaleY, 1);
    setScale(nextScale);
    stageRef.current.scale({ x: nextScale, y: nextScale });
    stageRef.current.position({ x: 0, y: 0 });
  }, [image, stageSize]);

  const zoomTo = (nextScale: number, pointer?: { x: number; y: number }) => {
    const stage = stageRef.current;
    if (!stage) return;
    const oldScale = stage.scaleX();
    const pos = pointer || stage.getPointerPosition() || { x: stageSize.width / 2, y: stageSize.height / 2 };
    const mousePointTo = {
      x: (pos.x - stage.x()) / oldScale,
      y: (pos.y - stage.y()) / oldScale,
    };
    setScale(nextScale);
    stage.scale({ x: nextScale, y: nextScale });
    const newPos = {
      x: pos.x - mousePointTo.x * nextScale,
      y: pos.y - mousePointTo.y * nextScale,
    };
    stage.position(newPos);
  };

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    const newScale = e.evt.deltaY > 0 ? oldScale * 0.9 : oldScale * 1.1;
    zoomTo(Math.max(0.2, Math.min(5, newScale)), pointer || undefined);
  };

  const getStagePoint = (stage: any) => {
    const pointer = stage.getPointerPosition();
    if (!pointer) return null;
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    return transform.point(pointer);
  };

  const onStageClick = (e: any) => {
    if (mode !== 'calibrate') return;
    const stage = e.target.getStage();
    const pos = getStagePoint(stage);
    if (!pos) return;
    const newPoints = [...points, { x: pos.x, y: pos.y }];
    setPoints(newPoints);
    if (newPoints.length === 2) {
      setShowModal(true);
    }
  };

  const onTouchMove = (e: any) => {
    if (e.evt.touches.length !== 2) {
      lastDistRef.current = null;
      lastCenterRef.current = null;
      return;
    }
    e.evt.preventDefault();
    const stage = stageRef.current;
    const touch1 = e.evt.touches[0];
    const touch2 = e.evt.touches[1];
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const center = {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };

    if (!lastDistRef.current || !lastCenterRef.current) {
      lastDistRef.current = dist;
      lastCenterRef.current = center;
      return;
    }

    const scaleBy = dist / lastDistRef.current;
    const newScale = Math.max(0.2, Math.min(5, scale * scaleBy));
    zoomTo(newScale, center);

    const stagePos = stage.position();
    const dxCenter = center.x - lastCenterRef.current.x;
    const dyCenter = center.y - lastCenterRef.current.y;
    stage.position({ x: stagePos.x + dxCenter, y: stagePos.y + dyCenter });

    lastDistRef.current = dist;
    lastCenterRef.current = center;
  };

  const saveCalibration = async () => {
    if (!pageId || points.length < 2) return;
    const payload = {
      p1x: Math.round(points[0].x),
      p1y: Math.round(points[0].y),
      p2x: Math.round(points[1].x),
      p2y: Math.round(points[1].y),
      realDistance: Number(distance),
      realUnit: unit,
    };
    const data = await setCalibration(pageId, payload);
    setCalibrationState(data);
    setMode('view');
    setPoints([]);
    setShowModal(false);
    setDistance('');
  };

  if (!upload || !activePage) {
    return <p>Loading viewer...</p>;
  }

  return (
    <div className="layout">
      <div className="sidebar">
        <button className="button" onClick={() => setMode(mode === 'view' ? 'calibrate' : 'view')}>
          {mode === 'view' ? 'Calibrate' : 'Exit'}
        </button>
        {upload.pages.map((page: any) => (
          <img
            key={page.id}
            src={pageThumbUrl(page.id)}
            className={`thumb ${page.id === activePage.id ? 'active' : ''}`}
            onClick={() => setActivePage(page)}
          />
        ))}
      </div>
      <div className="viewer-panel">
        <div className="viewer-toolbar card">
          <strong>Plan Viewer</strong>
          <span>Zoom: {(scale * 100).toFixed(0)}%</span>
          <button className="button" onClick={() => zoomTo(Math.min(5, scale * 1.2))}>+</button>
          <button className="button" onClick={() => zoomTo(Math.max(0.2, scale * 0.8))}>-</button>
          <button className="button" onClick={() => zoomTo(1)}>100%</button>
          <button
            className="button"
            onClick={() => {
              if (!image) return;
              const scaleX = stageSize.width / image.width;
              const scaleY = stageSize.height / image.height;
              zoomTo(Math.min(scaleX, scaleY, 1));
            }}
          >
            Fit
          </button>
          <div className="toggle-group">
            <button className="toggle" disabled>Layers (soon)</button>
            <button className="toggle" disabled>Snap-to-line (soon)</button>
          </div>
        </div>
        <div className="viewer" ref={containerRef}>
          <Stage
            width={stageSize.width}
            height={stageSize.height}
            draggable
            onWheel={handleWheel}
            onClick={onStageClick}
            onTap={onStageClick}
            onTouchMove={onTouchMove}
            ref={stageRef}
            scaleX={scale}
            scaleY={scale}
          >
            <Layer>
              {image && <KonvaImage image={image} />}
              {points.length === 2 && (
                <Line points={[points[0].x, points[0].y, points[1].x, points[1].y]} stroke="#2f6fed" strokeWidth={2} />
              )}
              {calibration && (
                <Text
                  text={`Scale: ${calibration.pixelsPerUnit.toFixed(2)} px/${calibration.realUnit.toLowerCase()}`}
                  x={20}
                  y={20}
                  fill="#2f6fed"
                  fontSize={16}
                />
              )}
              {image && (
                <Text
                  text={`Resolution: ${imageSize.width} x ${imageSize.height}`}
                  x={20}
                  y={44}
                  fill="#6b7a99"
                  fontSize={12}
                />
              )}
            </Layer>
          </Stage>
        </div>
      </div>
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Enter real distance</h3>
            <input
              className="input"
              type="number"
              placeholder="Distance"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
            />
            <select className="input" value={unit} onChange={(e) => setUnit(e.target.value)}>
              <option value="FT">Feet</option>
              <option value="IN">Inches</option>
              <option value="MM">Millimeters</option>
            </select>
            <button className="button" onClick={saveCalibration}>Save</button>
          </div>
        </div>
      )}
    </div>
  );
}
