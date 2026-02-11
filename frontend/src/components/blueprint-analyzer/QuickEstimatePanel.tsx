import PanelCard from './PanelCard';
import { useBlueprintAnalyzerStore, type PricingTier } from '../../stores/blueprintAnalyzerStore';
import { TIER_ESTIMATES } from '../../lib/blueprintData';
import { cn } from '../../lib/utils';

const TIERS: { key: PricingTier; name: string; price: string }[] = [
  { key: 'production', name: 'Production', price: 'Base Tier' },
  { key: 'custom', name: 'Custom', price: 'Mid Tier' },
  { key: 'premium', name: 'Premium', price: 'High Tier' },
];

export default function QuickEstimatePanel() {
  const { selectedTier, setSelectedTier } = useBlueprintAnalyzerStore();
  const tierData = TIER_ESTIMATES[selectedTier];

  return (
    <PanelCard icon="💰" title="Quick Estimate" animationDelay={100}>
      {/* Tier Selector */}
      <div className="grid grid-cols-3 gap-1.5 mb-3">
        {TIERS.map((tier) => (
          <button
            key={tier.key}
            className={cn(
              'bg-slate-950 border border-slate-700/80 rounded-md px-2 py-2 text-center cursor-pointer transition-all',
              'hover:border-cyan-500/50',
              selectedTier === tier.key && 'bg-cyan-500/10 border-cyan-500/50'
            )}
            onClick={() => setSelectedTier(tier.key)}
          >
            <div
              className={cn(
                'text-[11px] font-bold uppercase tracking-wide text-slate-200',
                selectedTier === tier.key && 'text-cyan-400'
              )}
            >
              {tier.name}
            </div>
            <div className="font-mono text-[10px] text-slate-500 mt-0.5">{tier.price}</div>
          </button>
        ))}
      </div>

      {/* Estimate Rows */}
      <div className="flex flex-col gap-1.5">
        {tierData.rows.map((row) => (
          <div
            key={row.name}
            className="flex justify-between items-center px-3 py-2 bg-slate-950 rounded-md border border-slate-700/50"
          >
            <span className="text-xs font-medium text-slate-300">{row.name}</span>
            <span className="font-mono text-[13px] font-bold text-orange-400">{row.cost}</span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="flex justify-between items-center px-4 py-3 mt-2 bg-gradient-to-r from-cyan-500/8 to-cyan-500/5 border border-cyan-500/20 rounded-lg">
        <span className="font-bold text-sm text-slate-100">Total Estimate</span>
        <span className="font-mono text-xl font-bold text-cyan-400">{tierData.total}</span>
      </div>
    </PanelCard>
  );
}
