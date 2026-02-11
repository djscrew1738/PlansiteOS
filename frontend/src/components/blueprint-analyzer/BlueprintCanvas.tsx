import { useCallback, useRef } from 'react';
import { useBlueprintAnalyzerStore } from '../../stores/blueprintAnalyzerStore';
import BlueprintSVG from './BlueprintSVG';
import CanvasToolbar from './CanvasToolbar';

interface MeasurePointOverlayProps {
  x: number;
  y: number;
}

function MeasurePointOverlay({ x, y }: MeasurePointOverlayProps) {
  return (
    <div
      className="absolute w-3.5 h-3.5 border-2 border-orange-500 bg-orange-500/30 rounded-full -translate-x-1/2 -translate-y-1/2 cursor-grab z-10 hover:scale-130 transition-transform"
      style={{ left: `${x}%`, top: `${y}%` }}
    />
  );
}

interface MeasureLabelOverlayProps {
  x: number;
  y: number;
  label: string;
}

function MeasureLabelOverlay({ x, y, label }: MeasureLabelOverlayProps) {
  return (
    <div
      className="absolute bg-orange-500 text-white font-mono text-[11px] font-bold px-2 py-0.5 rounded whitespace-nowrap z-[11] pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      {label}
    </div>
  );
}

export default function BlueprintCanvas() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const {
    currentTool,
    zoomLevel,
    scaleRatio,
    isFileUploaded,
    measurePoints,
    measurements,
    hasAnalysisResult,
    analysisResult,
    addMeasurePoint,
    setFileUploaded,
  } = useBlueprintAnalyzerStore();

  const showBlueprint = isFileUploaded || hasAnalysisResult;

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (currentTool !== 'measure') return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      addMeasurePoint({
        id: crypto.randomUUID(),
        x,
        y,
      });
    },
    [currentTool, addMeasurePoint]
  );

  const handleUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setFileUploaded(true, file.name);
      }
    },
    [setFileUploaded]
  );

  // Combine pre-set measurements from analysis + user-created
  const allMeasurements = hasAnalysisResult && analysisResult
    ? [...analysisResult.measurements, ...measurements]
    : measurements;

  // Pre-set measurement overlays from analysis
  const presetOverlays = hasAnalysisResult && analysisResult
    ? [
        { p1: { x: 12, y: 14 }, p2: { x: 42, y: 14 }, label: "12' - 6\"" },
        { p1: { x: 55, y: 53 }, p2: { x: 95, y: 53 }, label: "18' - 0\"" },
      ]
    : [];

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-xl overflow-hidden flex flex-col min-h-[500px]">
      <CanvasToolbar />

      <div
        ref={canvasRef}
        className="flex-1 relative cursor-crosshair overflow-hidden"
        style={{
          backgroundImage:
            'linear-gradient(rgba(26,58,106,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(26,58,106,0.15) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
        onClick={handleCanvasClick}
      >
        {/* Upload Placeholder */}
        {!showBlueprint && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-slate-500 transition-opacity">
            <div
              className="w-80 p-10 border-2 border-dashed border-slate-700 rounded-xl text-center transition-all cursor-pointer hover:border-cyan-500 hover:bg-cyan-500/5"
              onClick={handleUpload}
            >
              <div className="text-4xl mb-3">📐</div>
              <div className="font-semibold text-[15px] text-slate-200 mb-1.5">
                Drop Blueprint PDF Here
              </div>
              <div className="text-xs text-slate-500 leading-relaxed">
                or{' '}
                <span className="text-cyan-400 font-semibold cursor-pointer">browse files</span>{' '}
                to upload
                <br />
                Supports PDF, PNG, JPG · Max 50MB
              </div>
            </div>
          </div>
        )}

        {/* Rendered Blueprint */}
        {showBlueprint && (
          <div className="absolute inset-0">
            <div className="w-full h-full relative">
              <BlueprintSVG />

              {/* Pre-set Measurement Overlays */}
              {presetOverlays.map((overlay, i) => (
                <div key={`preset-${i}`}>
                  <MeasurePointOverlay x={overlay.p1.x} y={overlay.p1.y} />
                  <MeasurePointOverlay x={overlay.p2.x} y={overlay.p2.y} />
                  <MeasureLabelOverlay
                    x={(overlay.p1.x + overlay.p2.x) / 2}
                    y={(overlay.p1.y + overlay.p2.y) / 2 - 3}
                    label={overlay.label}
                  />
                </div>
              ))}

              {/* In-progress Measurement Points */}
              {measurePoints.map((point) => (
                <MeasurePointOverlay key={point.id} x={point.x} y={point.y} />
              ))}

              {/* Completed User Measurements */}
              {measurements.map((m) => (
                <div key={m.id}>
                  <MeasurePointOverlay x={m.points[0].x} y={m.points[0].y} />
                  <MeasurePointOverlay x={m.points[1].x} y={m.points[1].y} />
                  <MeasureLabelOverlay
                    x={(m.points[0].x + m.points[1].x) / 2}
                    y={(m.points[0].y + m.points[1].y) / 2 - 3}
                    label={m.label}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Canvas Status Bar */}
        <div className="absolute bottom-3 left-3 flex gap-3 font-mono text-[11px] text-slate-500">
          <div className="bg-slate-900/85 backdrop-blur-sm px-2.5 py-1 rounded-md border border-slate-700/80">
            Tool: <span className="text-cyan-400">{currentTool.charAt(0).toUpperCase() + currentTool.slice(1)}</span>
          </div>
          <div className="bg-slate-900/85 backdrop-blur-sm px-2.5 py-1 rounded-md border border-slate-700/80">
            Zoom: <span className="text-cyan-400">{zoomLevel}%</span>
          </div>
          <div className="bg-slate-900/85 backdrop-blur-sm px-2.5 py-1 rounded-md border border-slate-700/80">
            Scale: <span className="text-cyan-400">{scaleRatio}</span>
          </div>
        </div>

        {/* Scale Bar */}
        {showBlueprint && (
          <div className="absolute bottom-3 right-3 bg-slate-900/85 backdrop-blur-sm px-3 py-2 rounded-md border border-slate-700/80 flex items-center gap-2">
            <div className="w-[60px] h-0.5 bg-cyan-400 relative">
              <div className="absolute -top-[3px] left-0 w-0.5 h-2 bg-cyan-400" />
              <div className="absolute -top-[3px] right-0 w-0.5 h-2 bg-cyan-400" />
            </div>
            <span className="font-mono text-[11px] text-cyan-400">10 ft</span>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
