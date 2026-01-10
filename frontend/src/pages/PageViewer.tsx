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

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };
    const newScale = e.evt.deltaY > 0 ? oldScale * 0.9 : oldScale * 1.1;
    setScale(newScale);
    stage.scale({ x: newScale, y: newScale });
    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    stage.position(newPos);
  };

  const onStageClick = (e: any) => {
    if (mode !== 'calibrate') return;
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (!pos) return;
    const newPoints = [...points, { x: pos.x, y: pos.y }];
    setPoints(newPoints);
    if (newPoints.length === 2) {
      setShowModal(true);
    }
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
      <div className="viewer">
        <Stage
          width={window.innerWidth - 220}
          height={window.innerHeight - 160}
          draggable
          onWheel={handleWheel}
          onClick={onStageClick}
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
          </Layer>
        </Stage>
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
