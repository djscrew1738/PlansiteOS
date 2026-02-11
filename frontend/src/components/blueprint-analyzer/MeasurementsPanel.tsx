import PanelCard from './PanelCard';
import type { Measurement } from '../../stores/blueprintAnalyzerStore';

interface MeasurementsPanelProps {
  measurements: Measurement[];
}

export default function MeasurementsPanel({ measurements }: MeasurementsPanelProps) {
  return (
    <PanelCard icon="📏" title="Measurements" animationDelay={150}>
      <div className="flex flex-col gap-1.5">
        {measurements.map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-2.5 px-3 py-2 bg-slate-950 rounded-md border border-slate-700/50 text-xs"
          >
            <div className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
            <div className="text-slate-400 flex-1">{m.description}</div>
            <div className="font-mono font-bold text-orange-400">{m.valueFeet}</div>
          </div>
        ))}
        {measurements.length === 0 && (
          <div className="text-center py-4 text-xs text-slate-500">
            No measurements yet. Use the Measure tool to add measurements.
          </div>
        )}
      </div>
    </PanelCard>
  );
}
