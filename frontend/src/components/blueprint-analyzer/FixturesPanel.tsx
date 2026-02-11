import PanelCard from './PanelCard';
import type { DetectedFixture } from '../../stores/blueprintAnalyzerStore';

interface FixturesPanelProps {
  fixtures: DetectedFixture[];
}

export default function FixturesPanel({ fixtures }: FixturesPanelProps) {
  return (
    <PanelCard icon="🚿" title="Detected Fixtures" animationDelay={50}>
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="text-left px-2.5 py-2 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-700/80 font-semibold">
              Fixture
            </th>
            <th className="text-left px-2.5 py-2 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-700/80 font-semibold">
              Location
            </th>
            <th className="text-right px-2.5 py-2 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-700/80 font-semibold">
              Qty
            </th>
          </tr>
        </thead>
        <tbody>
          {fixtures.map((fixture, i) => (
            <tr key={i}>
              <td className="px-2.5 py-2 text-slate-400 border-b border-slate-700/50 last:border-b-0">
                {fixture.type}
              </td>
              <td className="px-2.5 py-2 text-slate-400 border-b border-slate-700/50 last:border-b-0">
                {fixture.location}
              </td>
              <td className="px-2.5 py-2 border-b border-slate-700/50 last:border-b-0 text-right font-mono font-bold text-cyan-400">
                {fixture.quantity}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </PanelCard>
  );
}
