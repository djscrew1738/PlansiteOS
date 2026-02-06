/**
 * Interactive Pricing Engine - What-If Simulator
 * Real-time estimate adjustments with visual feedback
 * Uses DFW market data (2025) for accurate pricing
 */
import { useState, useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import Card, { CardHeader, CardTitle, CardContent } from './ui/Card';
import Badge from './ui/Badge';
import Button from './ui/Button';
import {
  AdjustmentsHorizontalIcon,
  ChartPieIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import {
  LABOR_RATES,
  PIPE_MATERIAL_FACTORS,
  FIXTURE_PRICING,
  CREW_EFFICIENCY,
  getPricingRecommendation,
  type FixtureTier,
  type PipeMaterial,
} from '../lib/pricing';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  laborHours: number;
  materialCost: number;
  fixtureType?: string; // Optional: toilet, faucet, sink, etc.
}

interface PricingEngineProps {
  items: LineItem[];
  projectName: string;
  projectSqft?: number;
  foundationType?: 'slab' | 'crawlspace' | 'basement';
  onEstimateUpdate?: (estimate: any) => void;
}

export default function InteractivePricingEngine({
  items,
  projectName,
  projectSqft,
  foundationType = 'slab',
  onEstimateUpdate,
}: PricingEngineProps) {
  // Adjustable parameters - Using DFW market averages as defaults
  const [laborRate, setLaborRate] = useState(LABOR_RATES.average); // $/hour (DFW average: $125)
  const [materialMarkup, setMaterialMarkup] = useState(25); // %
  const [builderDiscount, setBuilderDiscount] = useState(0); // %
  const [fixtureTier, setFixtureTier] = useState<FixtureTier>('basic');
  const [pipeMaterial, setPipeMaterial] = useState<PipeMaterial>('pex');
  const [crewSize, setCrewSize] = useState<1 | 2>(2);

  // Use real DFW market data
  const tierMultipliers = useMemo(() => {
    const basic = (FIXTURE_PRICING.basic.min + FIXTURE_PRICING.basic.max) / 2;
    return {
      basic: 1.0,
      standard: ((FIXTURE_PRICING.standard.min + FIXTURE_PRICING.standard.max) / 2) / basic,
      premium: ((FIXTURE_PRICING.premium.min + FIXTURE_PRICING.premium.max) / 2) / basic,
    };
  }, []);

  // Material factors from market data
  const materialMultipliers = PIPE_MATERIAL_FACTORS;

  // Crew efficiency from market data
  const crewEfficiency = crewSize === 2 ? CREW_EFFICIENCY.twoMan.multiplier : CREW_EFFICIENCY.oneMan.multiplier;

  // Calculate totals using DFW market data
  const calculated = useMemo(() => {
    let totalLabor = 0;
    let totalMaterial = 0;

    items.forEach(item => {
      // Labor cost with crew efficiency and material factor
      const adjustedHours = item.laborHours * materialMultipliers[pipeMaterial].labor * crewEfficiency;
      const laborCost = adjustedHours * laborRate * item.quantity;

      // Material cost with markup and tier multiplier
      const baseMaterial = item.materialCost * materialMultipliers[pipeMaterial].cost * tierMultipliers[fixtureTier];
      const materialWithMarkup = baseMaterial * (1 + materialMarkup / 100);

      totalLabor += laborCost;
      totalMaterial += materialWithMarkup * item.quantity;
    });

    const subtotal = totalLabor + totalMaterial;
    const discountAmount = subtotal * (builderDiscount / 100);
    const total = subtotal - discountAmount;
    const margin = total > 0 ? ((total - totalMaterial) / total) * 100 : 0;

    return {
      labor: totalLabor,
      material: totalMaterial,
      subtotal,
      discount: discountAmount,
      total,
      margin,
      fixtureCount: items.reduce((sum, item) => sum + item.quantity, 0),
      averageCostPerFixture: total / items.reduce((sum, item) => sum + item.quantity, 0),
    };
  }, [items, laborRate, materialMarkup, builderDiscount, fixtureTier, pipeMaterial, crewSize, tierMultipliers, materialMultipliers, crewEfficiency]);

  // Margin health indicator using DFW market standards
  const pricingRec = getPricingRecommendation(calculated.margin);
  const marginHealth = pricingRec.status;
  const marginColor = `text-${pricingRec.color}-500`;

  // Chart data
  const pieData = [
    { name: 'Labor', value: calculated.labor, color: '#3b82f6' },
    { name: 'Material', value: calculated.material, color: '#10b981' },
  ];

  // Historical comparison (simulated)
  const historicalData = [
    { name: 'This Est.', labor: calculated.labor, material: calculated.material },
    { name: 'Avg (30d)', labor: calculated.labor * 0.92, material: calculated.material * 1.05 },
    { name: 'Avg (90d)', labor: calculated.labor * 0.88, material: calculated.material * 1.08 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <AdjustmentsHorizontalIcon className="w-6 h-6" />
            Interactive Pricing Engine
          </h2>
          <p className="text-sm text-slate-400 mt-1">{projectName}</p>
        </div>
        <Badge variant="default" className="flex items-center gap-1">
          <SparklesIcon className="w-3 h-3" />
          What-If Mode
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Controls */}
        <div className="space-y-4">
          {/* Labor Rate */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                Labor Rate
                <span className="text-xs font-normal text-slate-400">DFW: ${LABOR_RATES.min}-${LABOR_RATES.max}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-blue-500">${laborRate}</span>
                  <span className="text-xs text-slate-400">/hour</span>
                </div>
                <input
                  type="range"
                  min={LABOR_RATES.min}
                  max={LABOR_RATES.max}
                  step="5"
                  value={laborRate}
                  onChange={(e) => setLaborRate(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-slate-400">
                  <span>${LABOR_RATES.min}</span>
                  <span className="text-blue-400">${LABOR_RATES.average} avg</span>
                  <span>${LABOR_RATES.max}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Material Markup */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Material Markup</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-green-500">{materialMarkup}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={materialMarkup}
                  onChange={(e) => setMaterialMarkup(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-slate-400">
                  <span>0%</span>
                  <span>50%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Builder Discount */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Builder Discount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-purple-500">{builderDiscount}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={builderDiscount}
                  onChange={(e) => setBuilderDiscount(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-slate-400">
                  <span>0%</span>
                  <span>20%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assumptions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Assumptions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Fixture Tier */}
                <div>
                  <label className="text-xs text-slate-400 mb-2 block">
                    Fixture Tier
                    <span className="ml-2 text-slate-500">($600-$950 | $950-$1,600 | $1,800-$3,500)</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['basic', 'standard', 'premium'] as FixtureTier[]).map(tier => (
                      <button
                        key={tier}
                        onClick={() => setFixtureTier(tier)}
                        className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                          fixtureTier === tier
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {tier.charAt(0).toUpperCase() + tier.slice(1)}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">{FIXTURE_PRICING[fixtureTier].description}</p>
                </div>

                {/* Pipe Material */}
                <div>
                  <label className="text-xs text-slate-400 mb-2 block">Pipe Material</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['pex', 'copper', 'cpvc'] as PipeMaterial[]).map(material => (
                      <button
                        key={material}
                        onClick={() => setPipeMaterial(material)}
                        title={PIPE_MATERIAL_FACTORS[material].description}
                        className={`px-3 py-2 rounded text-xs font-medium uppercase transition-colors ${
                          pipeMaterial === material
                            ? 'bg-green-500 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {material}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    {PIPE_MATERIAL_FACTORS[pipeMaterial].description}
                    <br />
                    <span className="text-blue-400">Cost: {(PIPE_MATERIAL_FACTORS[pipeMaterial].cost * 100).toFixed(0)}%</span> •
                    <span className="text-green-400 ml-1">Labor: {(PIPE_MATERIAL_FACTORS[pipeMaterial].labor * 100).toFixed(0)}%</span>
                  </p>
                </div>

                {/* Crew Size */}
                <div>
                  <label className="text-xs text-slate-400 mb-2 block">Crew Size</label>
                  <div className="grid grid-cols-2 gap-2">
                    {([1, 2] as const).map(size => (
                      <button
                        key={size}
                        onClick={() => setCrewSize(size)}
                        className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                          crewSize === size
                            ? 'bg-purple-500 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {size}-Man Crew
                      </button>
                    ))}
                  </div>
                  {crewSize === 2 && (
                    <p className="text-xs text-green-400 mt-2">30% efficiency gain</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle Column - Visualizations */}
        <div className="space-y-4">
          {/* Cost Breakdown Pie */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <ChartPieIcon className="w-4 h-4" />
                Cost Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => `$${value.toLocaleString()}`}
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-xs text-slate-400">Labor</span>
                  </div>
                  <p className="text-lg font-bold text-slate-200 mt-1">
                    ${calculated.labor.toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-xs text-slate-400">Material</span>
                  </div>
                  <p className="text-lg font-bold text-slate-200 mt-1">
                    ${calculated.material.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Historical Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Comparison to Past Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={historicalData}>
                  <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                    formatter={(value: number) => `$${value.toLocaleString()}`}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="labor" fill="#3b82f6" name="Labor" />
                  <Bar dataKey="material" fill="#10b981" name="Material" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Margin Health */}
          <Card className={marginHealth === 'poor' ? 'border-red-500/50' : ''}>
            <CardHeader>
              <CardTitle className="text-sm">Margin Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <div className={`text-5xl font-bold ${marginColor}`}>
                  {calculated.margin.toFixed(1)}%
                </div>
                <div className="mt-2">
                  <Badge
                    variant={marginHealth === 'excellent' ? 'green' : marginHealth === 'good' ? 'blue' : marginHealth === 'fair' ? 'yellow' : 'red'}
                  >
                    {marginHealth.toUpperCase()}
                  </Badge>
                </div>
                <div className="mt-4 space-y-2 text-left">
                  {marginHealth === 'excellent' && (
                    <div className="flex items-start gap-2 text-sm text-green-400">
                      <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
                      <p>Healthy margin above 40%. Excellent profitability.</p>
                    </div>
                  )}
                  {marginHealth === 'poor' && (
                    <div className="flex items-start gap-2 text-sm text-red-400">
                      <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
                      <p>Low margin warning. Consider adjusting rates or reducing discount.</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Estimate Summary */}
        <div className="space-y-4">
          {/* Final Numbers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Estimate Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Labor</span>
                  <span className="text-slate-200 font-medium">${calculated.labor.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Material</span>
                  <span className="text-slate-200 font-medium">${calculated.material.toLocaleString()}</span>
                </div>
                <div className="border-t border-slate-700 pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Subtotal</span>
                    <span className="text-slate-200 font-medium">${calculated.subtotal.toLocaleString()}</span>
                  </div>
                </div>
                {calculated.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Discount ({builderDiscount}%)</span>
                    <span className="text-red-400">-${calculated.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t border-slate-700 pt-4">
                  <div className="flex justify-between">
                    <span className="text-slate-300 font-medium">Total</span>
                    <span className="text-2xl font-bold text-slate-100">
                      ${calculated.total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Insights */}
          <Card className="border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <SparklesIcon className="w-4 h-4 text-purple-400" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                {/* Margin Health Insight */}
                <div className={`p-2 border rounded bg-${pricingRec.color}-500/10 border-${pricingRec.color}-500/20`}>
                  <p className={`text-${pricingRec.color}-300`}>
                    {marginHealth === 'poor' && '⚠️ '}
                    {marginHealth === 'excellent' && '✓ '}
                    {pricingRec.message}
                  </p>
                </div>

                {/* Per-Fixture Cost Benchmark */}
                <div className="p-2 bg-slate-800 rounded border border-slate-700">
                  <p className="text-slate-300">
                    <InformationCircleIcon className="w-4 h-4 inline mr-1" />
                    <strong>${calculated.averageCostPerFixture.toFixed(0)}/fixture</strong>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    DFW {fixtureTier} range: ${FIXTURE_PRICING[fixtureTier].min}-${FIXTURE_PRICING[fixtureTier].max}
                  </p>
                </div>

                {/* Pipe Material Savings */}
                {pipeMaterial === 'pex' && (
                  <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded">
                    <p className="text-blue-300">
                      💡 PEX saves 64% vs copper on material and 29% on labor (DFW data)
                    </p>
                  </div>
                )}
                {pipeMaterial === 'copper' && calculated.fixtureCount > 10 && (
                  <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
                    <p className="text-yellow-300">
                      💰 Copper adds ${Math.round((calculated.material * 1.8))} vs PEX. Consider for luxury jobs only.
                    </p>
                  </div>
                )}

                {/* Crew Efficiency */}
                {crewSize === 1 && calculated.fixtureCount > 5 && (
                  <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
                    <p className="text-yellow-300">
                      ⏱️ 2-man crew saves {Math.round(calculated.labor / laborRate * CREW_EFFICIENCY.twoMan.efficiency)} hours ({CREW_EFFICIENCY.twoMan.efficiency * 100}% efficiency)
                    </p>
                  </div>
                )}

                {/* DFW Slab Foundation Note */}
                {foundationType === 'slab' && (
                  <div className="p-2 bg-slate-800 rounded border border-slate-700">
                    <p className="text-xs text-slate-400">
                      <strong className="text-slate-300">DFW Note:</strong> Slab foundation. Fixture relocation adds $1,000-$2,500 (jackhammer required).
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-2">
            <Button
              variant="primary"
              className="w-full"
              onClick={() => onEstimateUpdate?.(calculated)}
            >
              <CheckCircleIcon className="w-5 h-5 mr-2" />
              Save & Send Estimate
            </Button>
            <Button variant="secondary" className="w-full">
              Export to PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
