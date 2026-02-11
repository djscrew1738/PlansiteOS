import PanelCard from './PanelCard';
import type { AnalysisResult } from '../../stores/blueprintAnalyzerStore';
import { cn } from '../../lib/utils';

interface AISummaryPanelProps {
  result: AnalysisResult;
}

const TAG_COLORS = {
  cyan: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
  orange: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
  green: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
};

export default function AISummaryPanel({ result }: AISummaryPanelProps) {
  // Build the summary with highlighted portions
  const formatSummary = () => {
    const parts = result.summary.split(/(\d[\d,.]* sqft|\d+ wet areas|\d+ plumbing fixtures|\d+ linear feet)/gi);
    return parts.map((part, i) => {
      if (/sqft|wet areas|linear feet/i.test(part)) {
        return (
          <span key={i} className="text-cyan-400 font-semibold">
            {part}
          </span>
        );
      }
      if (/plumbing fixtures/i.test(part)) {
        return (
          <span key={i} className="text-orange-400 font-semibold">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <PanelCard icon="🧠" title="AI Plan Summary" animationDelay={0}>
      <div className="text-[13px] leading-[1.7] text-slate-400">
        <strong className="text-slate-200">Residential new-construction floor plan</strong> —
        single-story, approx <span className="text-cyan-400 font-semibold">{result.sqft.toLocaleString()} sqft</span>.
        Identified <span className="text-cyan-400 font-semibold">{result.wetAreas} wet areas</span>:
        master bath, hall bath, kitchen, and utility/laundry. Total of{' '}
        <span className="text-orange-400 font-semibold">{result.fixtureCount} plumbing fixtures</span>{' '}
        detected. Estimated{' '}
        <span className="text-cyan-400 font-semibold">{result.supplyLineFeet} linear feet</span> of
        supply line and{' '}
        <span className="text-cyan-400 font-semibold">{result.dwvFeet} linear feet</span> of DWV.
        The master bath is the most complex wet wall with tub, shower, WC, and dual lavatory on a
        shared stack.
      </div>

      <div className="flex flex-wrap gap-1.5 mt-3">
        {result.tags.map((tag) => (
          <span
            key={tag.label}
            className={cn(
              'text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded border',
              TAG_COLORS[tag.variant]
            )}
          >
            {tag.label}
          </span>
        ))}
      </div>
    </PanelCard>
  );
}
