/**
 * Interactive Pricing Engine - What-If Simulator
 * Real-time estimate adjustments with visual feedback
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
} from '@heroicons/react/24/outline';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  laborHours: number;
  materialCost: number;
}

interface PricingEngineProps {
  items: LineItem[];
  projectName: string;
  onEstimateUpdate?: (estimate: any) => void;
}

type FixtureGrade = 'builder' | 'mid' | 'premium';
type PipeMaterial = 'pex' | 'copper' | 'cpvc';

export default function InteractivePricingEngine({
  items,
  projectName,
  onEstimateUpdate,
}: PricingEngineProps) {
  // Adjustable parameters
  const [laborRate, setLaborRate] = useState(75); // $/hour
  const [materialMarkup, setMaterialMarkup] = useState(25); // %
  const [builderDiscount, setBuilderDiscount] = useState(0); // %
  const [fixtureGrade, setFixtureGrade] = useState<FixtureGrade>('builder');
  const [pipeMaterial, setPipeMaterial] = useState<PipeMaterial>('pex');
  const [crewSize, setCrewSize] = useState<1 | 2>(2);

  // Grade multipliers
  const gradeMultipliers: Record<FixtureGrade, number> = {
    builder: 1.0,
    mid: 1.35,
    premium: 1.85,
  };

  // Material multipliers
  const materialMultipliers: Record<PipeMaterial, { cost: number; labor: number }> = {
    pex: { cost: 1.0, labor: 1.0 },
    copper: { cost: 2.8, labor: 1.4 },
    cpvc: { cost: 1.3, labor: 1.1 },
  };

  // Crew efficiency
  const crewEfficiency = crewSize === 2 ? 0.7 : 1.0; // 2-man crew is 30% faster

  // Calculate totals
  const calculated = useMemo(() => {
    let totalLabor = 0;
    let totalMaterial = 0;

    items.forEach(item => {
      // Labor cost with crew efficiency
      const adjustedHours = item.laborHours * materialMultipliers[pipeMaterial].labor * crewEfficiency;
      const laborCost = adjustedHours * laborRate * item.quantity;

      // Material cost with markup and grade
      const baseMaterial = item.materialCost * materialMultipliers[pipeMaterial].cost * gradeMultipliers[fixtureGrade];
      const materialWithMarkup = baseMaterial * (1 + materialMarkup / 100);

      totalLabor += laborCost;
      totalMaterial += materialWithMarkup * item.quantity;
    });

    const subtotal = totalLabor + totalMaterial;
    const discountAmount = subtotal * (builderDiscount / 100);
    const total = subtotal - discountAmount;
    const margin = ((total - totalMaterial) / total) * 100;

    return {
      labor: totalLabor,
      material: totalMaterial,
      subtotal,
      discount: discountAmount,
      total,
      margin,
    };
  }, [items, laborRate, materialMarkup, builderDiscount, fixtureGrade, pipeMaterial, crewSize]);

  // Margin health indicator
  const marginHealth = calculated.margin >= 40 ? 'excellent' : calculated.margin >= 30 ? 'good' : calculated.margin >= 20 ? 'fair' : 'poor';
  const marginColor = marginHealth === 'excellent' ? 'text-green-500' : marginHealth === 'good' ? 'text-blue-500' : marginHealth === 'fair' ? 'text-yellow-500' : 'text-red-500';

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
              <CardTitle className="text-sm">Labor Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-blue-500">${laborRate}</span>
                  <span className="text-xs text-slate-400">/hour</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  step="5"
                  value={laborRate}
                  onChange={(e) => setLaborRate(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-slate-400">
                  <span>$50</span>
                  <span>$150</span>
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
                {/* Fixture Grade */}
                <div>
                  <label className="text-xs text-slate-400 mb-2 block">Fixture Grade</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['builder', 'mid', 'premium'] as FixtureGrade[]).map(grade => (
                      <button
                        key={grade}
                        onClick={() => setFixtureGrade(grade)}
                        className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                          fixtureGrade === grade
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {grade === 'mid' ? 'Mid-Grade' : grade.charAt(0).toUpperCase() + grade.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pipe Material */}
                <div>
                  <label className="text-xs text-slate-400 mb-2 block">Pipe Material</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['pex', 'copper', 'cpvc'] as PipeMaterial[]).map(material => (
                      <button
                        key={material}
                        onClick={() => setPipeMaterial(material)}
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
                {calculated.margin < 25 && (
                  <div className="p-2 bg-red-500/10 border border-red-500/20 rounded">
                    <p className="text-red-300">⚠️ Margin below target. Consider +$5/hr labor rate.</p>
                  </div>
                )}
                {pipeMaterial === 'pex' && (
                  <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded">
                    <p className="text-blue-300">💡 PEX saves 40% vs copper on material and 30% on labor</p>
                  </div>
                )}
                {crewSize === 1 && (
                  <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
                    <p className="text-yellow-300">⏱️ 2-man crew could save {Math.round(calculated.labor / laborRate * 0.3)} hours</p>
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
