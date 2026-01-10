import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Layer, Line, Stage, Text } from 'react-konva';
import { getUpload, listPipelines, createPipeline } from '../components/api';

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
  const [pipelineForm, setPipelineForm] = useState({
    systemType: 'WATER_COLD',
    name: 'Water - Cold',
    phase: 'UNDERGROUND',
  });

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

  const pipelineOptions = useMemo(
    () => pipelines.map((pipe) => ({ value: pipe.id, label: pipe.name })),
    [pipelines]
  );

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
          <button className="toggle" disabled>Fixture Mode (soon)</button>
          <button className="toggle" disabled>Penetrations (soon)</button>
        </div>
        <div className="viewer">
          <Stage width={900} height={600} draggable>
            <Layer>
              <Text text="Routing canvas (V3)" x={20} y={20} fontSize={16} fill="#2f6fed" />
              {activePipeline && (
                <Text text={`Active: ${activePipeline.name}`} x={20} y={48} fontSize={12} fill="#6b7a99" />
              )}
              <Line points={[80, 120, 220, 140, 320, 200]} stroke="#2f6fed" strokeWidth={3} dash={[6, 4]} />
            </Layer>
          </Stage>
        </div>
      </div>
      <div className="sidebar">
        <h3>Inspector</h3>
        <div className="card">
          <p>Segment diameter</p>
          <select className="input" defaultValue="3/4">
            <option value="1/2">1/2"</option>
            <option value="3/4">3/4"</option>
            <option value="1">1"</option>
          </select>
          <p>Material</p>
          <select className="input" defaultValue="PEX">
            <option value="PEX">PEX</option>
            <option value="Copper">Copper</option>
            <option value="PVC">PVC</option>
          </select>
          <p>Phase</p>
          <select className="input" defaultValue="UNDERGROUND">
            {PHASES.map((phase) => (
              <option key={phase.value} value={phase.value}>
                {phase.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
