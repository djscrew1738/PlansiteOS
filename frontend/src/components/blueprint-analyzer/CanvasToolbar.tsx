import { useBlueprintAnalyzerStore, type CanvasTool } from '../../stores/blueprintAnalyzerStore';
import { cn } from '../../lib/utils';

interface ToolButtonProps {
  icon: string;
  label: string;
  tool?: CanvasTool;
  isActive?: boolean;
  onClick?: () => void;
  title?: string;
}

function ToolButton({ icon, label, tool, isActive, onClick, title }: ToolButtonProps) {
  const { currentTool, setTool } = useBlueprintAnalyzerStore();
  const active = isActive ?? (tool !== undefined && currentTool === tool);

  const handleClick = () => {
    if (tool) setTool(tool);
    onClick?.();
  };

  return (
    <button
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium',
        'border border-transparent transition-all whitespace-nowrap',
        'hover:bg-slate-800 hover:text-slate-100',
        active
          ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
          : 'text-slate-400'
      )}
      onClick={handleClick}
      title={title || label}
    >
      <span>{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function ToolDivider() {
  return <div className="w-px h-5 bg-slate-700 mx-1.5 flex-shrink-0" />;
}

export default function CanvasToolbar() {
  const { zoomIn, zoomOut, setScaleRatio } = useBlueprintAnalyzerStore();

  const handleSetScale = () => {
    const scale = prompt('Set drawing scale (e.g., 1/4" = 1\', 1/8" = 1\'):', '1/4" = 1\'');
    if (scale) {
      setScaleRatio(scale);
    }
  };

  return (
    <div className="flex items-center gap-0.5 px-3 py-2 border-b border-slate-700/80 bg-slate-900/80 flex-wrap">
      <ToolButton icon="✋" label="Pan" tool="pan" />
      <ToolButton icon="⬚" label="Select" tool="select" />
      <ToolButton icon="📏" label="Measure" tool="measure" />
      <ToolButton icon="✏️" label="Annotate" tool="annotate" />
      <ToolDivider />
      <ToolButton icon="🚿" label="Fixture Tag" tool="fixture" title="Mark Fixtures" />
      <ToolButton icon="🔵" label="Pipe Trace" tool="pipe" title="Trace Pipe Run" />
      <ToolDivider />
      <ToolButton icon="➕" label="" onClick={zoomIn} title="Zoom In" />
      <ToolButton icon="➖" label="" onClick={zoomOut} title="Zoom Out" />
      <ToolButton icon="⊡" label="Fit" title="Fit to View" />
      <ToolDivider />
      <ToolButton icon="⚙️" label="Set Scale" onClick={handleSetScale} />
      <ToolButton icon="📥" label="Export" title="Export Measurements" />
    </div>
  );
}
