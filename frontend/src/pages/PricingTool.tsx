import { useState, useMemo, useEffect } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import {
  CalculatorIcon,
  Cog6ToothIcon,
  DocumentDuplicateIcon,
  ArrowPathIcon,
  PrinterIcon,
} from '@heroicons/react/24/outline';
import { useToast } from '../components/ui/Toast';

// Default pricing based on Lennar Brookstone Collection bid (DFW Market - Lewisville, TX)
// Base bid: $11,333.92 for 3.5 bath house
const DEFAULT_FIXTURE_PRICING = {
  waterHeater: {
    name: 'Water Heater (50 gal gas)',
    material: 650,
    labor: 450,
    description: '50 gallon gas water heater, installed',
  },
  toilet: {
    name: 'Toilet',
    material: 180,
    labor: 170,
    description: 'PROFLO toilet bowl & tank with seat',
  },
  lavatory: {
    name: 'Lavatory (Bathroom Sink)',
    material: 120,
    labor: 180,
    description: 'Lavatory faucet (MOEN EVA style) + rough-in',
  },
  kitchenSink: {
    name: 'Kitchen Sink',
    material: 280,
    labor: 320,
    description: 'Kitchen sink with faucet, disposal, and dishwasher/fridge lines',
  },
  bathtub: {
    name: 'Bathtub',
    material: 350,
    labor: 350,
    description: 'Tub with trim and valve (builder supplied tub)',
  },
  tubShowerCombo: {
    name: 'Tub/Shower Combo',
    material: 280,
    labor: 320,
    description: 'T&S valve, trim, and rough-in (builder supplied tub)',
  },
  shower: {
    name: 'Shower (Standalone)',
    material: 320,
    labor: 350,
    description: 'Shower base with valve and trim',
  },
  washerBox: {
    name: 'Washer Box',
    material: 85,
    labor: 115,
    description: 'Washing machine outlet box with valves',
  },
  hoseBib: {
    name: 'Hose Bib',
    material: 45,
    labor: 105,
    description: 'Frost-proof exterior hose bib',
  },
  gasDrop: {
    name: 'Gas Drop',
    material: 35,
    labor: 115,
    description: 'Gas line drop (furnace, water heater, fireplace, etc.)',
  },
};

type FixtureKey = keyof typeof DEFAULT_FIXTURE_PRICING;

interface FixtureQuantity {
  key: FixtureKey;
  quantity: number;
}

interface PricingConfig {
  [key: string]: {
    name: string;
    material: number;
    labor: number;
    description: string;
  };
}

export default function PricingTool() {
  const toast = useToast();
  const [showSettings, setShowSettings] = useState(false);
  const [markup, setMarkup] = useState(15);
  const [cityRequirements, setCityRequirements] = useState(450);

  // Load pricing config from localStorage or use defaults
  const [pricingConfig, setPricingConfig] = useState<PricingConfig>(() => {
    try {
      const saved = localStorage.getItem('pricing-config');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load pricing config:', e);
    }
    return DEFAULT_FIXTURE_PRICING;
  });

  // Fixture quantities
  const [quantities, setQuantities] = useState<Record<FixtureKey, number>>({
    waterHeater: 0,
    toilet: 0,
    lavatory: 0,
    kitchenSink: 0,
    bathtub: 0,
    tubShowerCombo: 0,
    shower: 0,
    washerBox: 0,
    hoseBib: 0,
    gasDrop: 0,
  });

  // Save pricing config to localStorage
  useEffect(() => {
    localStorage.setItem('pricing-config', JSON.stringify(pricingConfig));
  }, [pricingConfig]);

  // Calculate totals
  const calculations = useMemo(() => {
    let materialTotal = 0;
    let laborTotal = 0;
    const lineItems: Array<{
      name: string;
      quantity: number;
      material: number;
      labor: number;
      total: number;
    }> = [];

    (Object.keys(quantities) as FixtureKey[]).forEach((key) => {
      const qty = quantities[key];
      if (qty > 0) {
        const config = pricingConfig[key];
        const material = config.material * qty;
        const labor = config.labor * qty;
        materialTotal += material;
        laborTotal += labor;
        lineItems.push({
          name: config.name,
          quantity: qty,
          material,
          labor,
          total: material + labor,
        });
      }
    });

    const subtotal = materialTotal + laborTotal;
    const markupAmount = subtotal * (markup / 100);
    const grandTotal = subtotal + markupAmount + cityRequirements;

    return {
      materialTotal,
      laborTotal,
      subtotal,
      markupAmount,
      cityRequirements,
      grandTotal,
      lineItems,
    };
  }, [quantities, pricingConfig, markup, cityRequirements]);

  const handleQuantityChange = (key: FixtureKey, value: string) => {
    const numValue = parseInt(value) || 0;
    setQuantities((prev) => ({ ...prev, [key]: Math.max(0, numValue) }));
  };

  const handlePriceChange = (key: string, field: 'material' | 'labor', value: string) => {
    const numValue = parseFloat(value) || 0;
    setPricingConfig((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: Math.max(0, numValue),
      },
    }));
  };

  const resetQuantities = () => {
    setQuantities({
      waterHeater: 0,
      toilet: 0,
      lavatory: 0,
      kitchenSink: 0,
      bathtub: 0,
      tubShowerCombo: 0,
      shower: 0,
      washerBox: 0,
      hoseBib: 0,
      gasDrop: 0,
    });
  };

  const resetPricing = () => {
    setPricingConfig(DEFAULT_FIXTURE_PRICING);
    toast.success('Pricing reset', 'Restored to default DFW market pricing');
  };

  const loadSampleBid = () => {
    // Load the Lennar Brookstone bid as a sample
    setQuantities({
      waterHeater: 2,
      toilet: 4,
      lavatory: 6,
      kitchenSink: 1,
      bathtub: 1,
      tubShowerCombo: 2,
      shower: 1,
      washerBox: 1,
      hoseBib: 2,
      gasDrop: 7, // 2 furnace + 2 WH + 1 fireplace + 1 patio + 1 cooktop
    });
    setCityRequirements(450);
    toast.info('Sample loaded', 'Lennar Brookstone 3.5 bath bid loaded');
  };

  const copyToClipboard = () => {
    const text = `
Plumbing Estimate
=================
${calculations.lineItems.map((item) => `${item.quantity}x ${item.name}: $${item.total.toLocaleString()}`).join('\n')}

Material Total: $${calculations.materialTotal.toLocaleString()}
Labor Total: $${calculations.laborTotal.toLocaleString()}
Subtotal: $${calculations.subtotal.toLocaleString()}
Markup (${markup}%): $${calculations.markupAmount.toLocaleString()}
City Requirements: $${calculations.cityRequirements.toLocaleString()}
-------------------
GRAND TOTAL: $${calculations.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    `.trim();

    navigator.clipboard.writeText(text);
    toast.success('Copied', 'Estimate copied to clipboard');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Pricing Calculator</h1>
          <p className="text-slate-400 mt-1">
            DFW Market pricing based on Lennar Brookstone Collection standards
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={loadSampleBid}>
            <DocumentDuplicateIcon className="w-5 h-5 mr-2" />
            Load Sample Bid
          </Button>
          <Button variant="secondary" onClick={() => setShowSettings(!showSettings)}>
            <Cog6ToothIcon className="w-5 h-5 mr-2" />
            {showSettings ? 'Hide Settings' : 'Edit Pricing'}
          </Button>
        </div>
      </div>

      {/* Pricing Settings */}
      {showSettings && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Fixture Pricing Configuration</CardTitle>
              <Button variant="ghost" size="sm" onClick={resetPricing}>
                <ArrowPathIcon className="w-4 h-4 mr-2" />
                Reset to Defaults
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(Object.keys(pricingConfig) as FixtureKey[]).map((key) => (
                <div key={key} className="p-4 bg-slate-800 rounded-lg">
                  <h4 className="font-medium text-slate-200 mb-1">{pricingConfig[key].name}</h4>
                  <p className="text-xs text-slate-500 mb-3">{pricingConfig[key].description}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-slate-400">Material $</label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={pricingConfig[key].material}
                        onChange={(e) => handlePriceChange(key, 'material', e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Labor $</label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={pricingConfig[key].labor}
                        onChange={(e) => handlePriceChange(key, 'labor', e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Total per unit: ${(pricingConfig[key].material + pricingConfig[key].labor).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fixture Input */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  <CalculatorIcon className="w-5 h-5 inline-block mr-2" />
                  Enter Fixture Quantities
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={resetQuantities}>
                  Clear All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {(Object.keys(pricingConfig) as FixtureKey[]).map((key) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      {pricingConfig[key].name}
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={quantities[key] || ''}
                      onChange={(e) => handleQuantityChange(key, e.target.value)}
                      placeholder="0"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      ${(pricingConfig[key].material + pricingConfig[key].labor).toLocaleString()}/ea
                    </p>
                  </div>
                ))}
              </div>

              {/* Additional Options */}
              <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Markup %
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={markup}
                    onChange={(e) => setMarkup(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    City Requirements $
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={cityRequirements}
                    onChange={(e) => setCityRequirements(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          {calculations.lineItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Line Item Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-right">Material</TableHead>
                      <TableHead className="text-right">Labor</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calculations.lineItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">${item.material.toLocaleString()}</TableCell>
                        <TableCell className="text-right">${item.labor.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-semibold">
                          ${item.total.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Summary */}
        <div className="space-y-6">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Estimate Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Material Total:</span>
                  <span className="text-slate-200">
                    ${calculations.materialTotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Labor Total:</span>
                  <span className="text-slate-200">
                    ${calculations.laborTotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm border-t border-slate-800 pt-3">
                  <span className="text-slate-400">Subtotal:</span>
                  <span className="text-slate-200">
                    ${calculations.subtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Markup ({markup}%):</span>
                  <span className="text-slate-200">
                    ${calculations.markupAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">City Requirements:</span>
                  <span className="text-slate-200">
                    ${calculations.cityRequirements.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-xl font-bold border-t border-slate-800 pt-4">
                  <span className="text-slate-100">Grand Total:</span>
                  <span className="text-blue-500">
                    ${calculations.grandTotal.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <Button variant="primary" className="w-full" onClick={copyToClipboard}>
                  <DocumentDuplicateIcon className="w-4 h-4 mr-2" />
                  Copy Estimate
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => window.print()}
                >
                  <PrinterIcon className="w-4 h-4 mr-2" />
                  Print
                </Button>
              </div>

              {/* Reference note */}
              <div className="mt-6 p-3 bg-slate-800 rounded-lg">
                <p className="text-xs text-slate-400">
                  <strong className="text-slate-300">Reference:</strong> Base pricing derived from
                  Lennar Brookstone Collection bid (3/16/18) - Lakewood Hills, Lewisville TX.
                  3.5 bath house @ $11,333.92 + $450 city requirements.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
