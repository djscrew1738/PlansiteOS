import { useState, useMemo, useCallback } from 'react';
import { ChevronDownIcon, ClipboardDocumentIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useToast } from '../components/ui/Toast';

// ══════════════════════════════════════
//  TIER MULTIPLIERS
// ══════════════════════════════════════
const TIERS = {
  production: { label: 'Production Home', short: 'PRODUCTION', mult: 1.0, icon: '🏠', desc: 'Standard builder-grade new construction' },
  custom: { label: 'Custom Home', short: 'CUSTOM', mult: 1.25, icon: '🏡', desc: 'Custom builds with upgraded finishes' },
  premium: { label: 'Premium Home', short: 'PREMIUM', mult: 1.5625, icon: '🏰', desc: 'High-end luxury builds, full premium' },
} as const;

type TierKey = keyof typeof TIERS;

// ══════════════════════════════════════
//  BASE (PRODUCTION) FIXTURE DATA
// ══════════════════════════════════════
const fixtureData = [
  {
    section: 'Kitchen',
    items: [
      { id: 'kitchen-sink', name: 'Kitchen Sink', desc: 'Supplied by Builder', base: 0, defaultQty: 1 },
      { id: 'water-line-fridge', name: 'Water Line — Fridge', desc: 'Fridge water supply', base: 85, defaultQty: 1 },
      { id: 'water-line-dishwasher', name: 'Water Line — Dishwasher', desc: 'Dishwasher supply', base: 85, defaultQty: 1 },
      { id: 'disposal', name: 'Disposal', desc: 'Garbage Disposal 1/3 HP Badger 1', base: 145, defaultQty: 1 },
      { id: 'kitchen-faucet', name: 'Kitchen Faucet', desc: 'Moen Arbor 7594SRS', base: 210, defaultQty: 1 },
      { id: 'air-gap-cap', name: 'Air Gap Cap', desc: 'BN finish', base: 15, defaultQty: 1 },
    ],
  },
  {
    section: 'Garage',
    items: [
      { id: 'water-heater', name: 'Water Heater', desc: '50 Gal Gas Water Heater', base: 950, defaultQty: 2 },
    ],
  },
  {
    section: 'Full Bath (Master / Main)',
    items: [
      { id: 'master-tub', name: 'Tub', desc: 'Supplied by Builder', base: 0, defaultQty: 1 },
      { id: 'master-shower-base', name: 'Shower Base', desc: 'Supplied by Builder', base: 0, defaultQty: 1 },
      { id: 'master-lavatory', name: 'Lavatory', desc: 'Moen EVA 6410 BN', base: 125, defaultQty: 2 },
      { id: 'master-shower-trim', name: 'Shower Trim', desc: 'Moen EVA T2132 BN / 2520', base: 185, defaultQty: 1 },
      { id: 'master-shower-valve', name: 'Shower Valve', desc: 'FP62365', base: 95, defaultQty: 1 },
      { id: 'master-tub-trim', name: 'Tub Trim', desc: 'Moen EVA T2131CH/FP62365/3929CH', base: 210, defaultQty: 1 },
      { id: 'master-toilet', name: 'Toilet (Bowl & Tank)', desc: 'PROFLO PF1501WH / PF6112WH', base: 185, defaultQty: 1 },
      { id: 'master-toilet-seat', name: 'Toilet Seat', desc: 'PROFLO PFTSEC2000CH', base: 35, defaultQty: 1 },
      { id: 'master-lav-top', name: 'Lavatory Top', desc: 'Supplied by Builder', base: 0, defaultQty: 2 },
    ],
  },
  {
    section: 'Bath 2 (T&S Combo)',
    items: [
      { id: 'bath2-ts-tub', name: 'T&S Tub', desc: 'Supplied by Builder', base: 0, defaultQty: 1 },
      { id: 'bath2-lavatory', name: 'Lavatory', desc: 'Moen EVA 6410 BN', base: 125, defaultQty: 1 },
      { id: 'bath2-ts-valve', name: 'T&S Valve', desc: 'FP62365', base: 95, defaultQty: 1 },
      { id: 'bath2-ts-trim', name: 'T&S Trim', desc: 'Moen EVA T2133 BN / 2520', base: 175, defaultQty: 1 },
      { id: 'bath2-toilet', name: 'Toilet (Bowl & Tank)', desc: 'PROFLO PF1501WH / PF6112WH', base: 185, defaultQty: 1 },
      { id: 'bath2-toilet-seat', name: 'Toilet Seat', desc: 'PROFLO PFTSEC2000CH', base: 35, defaultQty: 1 },
      { id: 'bath2-lav-top', name: 'Lavatory Top', desc: 'Supplied by Builder', base: 0, defaultQty: 1 },
    ],
  },
  {
    section: 'Bath 3 (T&S Combo)',
    items: [
      { id: 'bath3-ts-tub', name: 'T&S Tub', desc: 'Supplied by Builder', base: 0, defaultQty: 1 },
      { id: 'bath3-lavatory', name: 'Lavatory', desc: 'Moen EVA 6410 BN', base: 125, defaultQty: 1 },
      { id: 'bath3-ts-valve', name: 'T&S Valve', desc: 'FP62365', base: 95, defaultQty: 1 },
      { id: 'bath3-ts-trim', name: 'T&S Trim', desc: 'Moen EVA T2133 BN / 2520', base: 175, defaultQty: 1 },
      { id: 'bath3-toilet', name: 'Toilet (Bowl & Tank)', desc: 'PROFLO PF1501WH / PF6112WH', base: 185, defaultQty: 1 },
      { id: 'bath3-toilet-seat', name: 'Toilet Seat', desc: 'PROFLO PFTSEC2000CH', base: 35, defaultQty: 1 },
      { id: 'bath3-lav-top', name: 'Lavatory Top', desc: 'Supplied by Builder', base: 0, defaultQty: 1 },
    ],
  },
  {
    section: 'Powder Room (Half Bath)',
    items: [
      { id: 'powder-lavatory', name: 'Lavatory', desc: 'Moen EVA 6410 BN', base: 125, defaultQty: 1 },
      { id: 'powder-toilet', name: 'Toilet (Bowl & Tank)', desc: 'PROFLO PF1501WH / PF6112WH', base: 185, defaultQty: 1 },
      { id: 'powder-toilet-seat', name: 'Toilet Seat', desc: 'PROFLO PFTSEC2000CH', base: 35, defaultQty: 1 },
      { id: 'powder-pedestal', name: 'Pedestal Sink', desc: 'Vortens 3039 / 3510', base: 165, defaultQty: 0 },
    ],
  },
  {
    section: 'Utility',
    items: [
      { id: 'washer-box', name: 'Washer Box', desc: 'W/D outlet box', base: 145, defaultQty: 1 },
    ],
  },
  {
    section: 'Gas Drops',
    items: [
      { id: 'gas-furnace', name: 'Gas Drop — Furnace', desc: 'Furnace gas line', base: 125, defaultQty: 2 },
      { id: 'gas-water-heater', name: 'Gas Drop — Water Heater', desc: 'WH gas supply', base: 125, defaultQty: 2 },
      { id: 'gas-fireplace', name: 'Gas Drop — Fireplace', desc: 'Fireplace gas line', base: 125, defaultQty: 1 },
      { id: 'gas-patio', name: 'Gas Drop — Patio', desc: 'Outdoor patio gas', base: 125, defaultQty: 1 },
      { id: 'gas-cooktop', name: 'Gas Drop — Cooktop', desc: 'Kitchen cooktop gas', base: 125, defaultQty: 1 },
    ],
  },
  {
    section: 'Outside',
    items: [
      { id: 'hose-bib', name: 'Hose Bib', desc: 'Frost Proof', base: 95, defaultQty: 2 },
      { id: 'sand', name: 'Sand', desc: 'Supplied by Builder', base: 0, defaultQty: 1 },
    ],
  },
];

// ══════════════════════════════════════
//  ADDERS DATA
// ══════════════════════════════════════
const addersData = [
  { id: 'city-lewisville', name: 'City Requirements (Lewisville)', amount: 450, defaultChecked: true },
  { id: 'pipe-insulation', name: 'Pipe Insulation — All 3/4" Hot Water Lines', amount: 250, defaultChecked: false },
  { id: 'wrap-plastic', name: 'Wrap Plastic', amount: 0, defaultChecked: true },
  { id: 'gas-tape', name: 'Gas Tape — Wrap PVC through brick', amount: 0, defaultChecked: true },
  { id: 'gravel', name: 'Gravel — 4" in meter box', amount: 0, defaultChecked: true },
  { id: 'arbor-eva-upgrade', name: 'ARBOR SRS/EVA BN Bath Fixtures Upgrade', amount: 470, defaultChecked: false },
];

// ══════════════════════════════════════
//  STYLES
// ══════════════════════════════════════
const styles = `
  .pricing-tool {
    --bg: #0a0c10;
    --surface: #12151a;
    --surface2: #1a1e25;
    --surface3: #222730;
    --border: #2a303b;
    --border-light: #343b48;
    --text: #e4e7ec;
    --text-dim: #8891a0;
    --text-muted: #555e6e;
    --radius: 10px;
    --radius-lg: 14px;
    --production: #3b82f6;
    --production-bg: rgba(59,130,246,0.08);
    --production-border: rgba(59,130,246,0.25);
    --custom: #a855f7;
    --custom-bg: rgba(168,85,247,0.08);
    --custom-border: rgba(168,85,247,0.25);
    --premium: #f59e0b;
    --premium-bg: rgba(245,158,11,0.08);
    --premium-border: rgba(245,158,11,0.25);
    --green: #22c55e;
    --green-dim: rgba(34,197,94,0.12);
    --orange: #f59e0b;
    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  }

  .pricing-tool.tier-production { --accent: var(--production); --accent-bg: var(--production-bg); --accent-border: var(--production-border); }
  .pricing-tool.tier-custom { --accent: var(--custom); --accent-bg: var(--custom-bg); --accent-border: var(--custom-border); }
  .pricing-tool.tier-premium { --accent: var(--premium); --accent-bg: var(--premium-bg); --accent-border: var(--premium-border); }

  .pricing-tool .top-bar {
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    padding: 14px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 50;
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  }

  .pricing-tool .brand {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .pricing-tool .logo-mark {
    width: 32px; height: 32px;
    background: var(--accent);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'JetBrains Mono', monospace;
    font-weight: 700;
    font-size: 12px;
    color: #fff;
    transition: background 0.4s;
  }

  .pricing-tool .brand h1 {
    font-size: 15px;
    font-weight: 700;
    color: var(--text);
  }

  .pricing-tool .brand h1 span {
    color: var(--text-muted);
    font-weight: 400;
    margin-left: 4px;
  }

  .pricing-tool .top-total {
    font-family: 'JetBrains Mono', monospace;
    font-size: 20px;
    font-weight: 700;
    color: var(--accent);
    transition: color 0.4s;
  }

  .pricing-tool .tier-selector {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 24px;
  }

  .pricing-tool .tier-card {
    background: var(--surface);
    border: 2px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 20px;
    cursor: pointer;
    transition: all 0.3s;
    position: relative;
    overflow: hidden;
  }

  .pricing-tool .tier-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: transparent;
    transition: background 0.3s;
  }

  .pricing-tool .tier-card:hover {
    background: var(--surface2);
    border-color: var(--border-light);
  }

  .pricing-tool .tier-card.active { border-color: var(--accent); background: var(--accent-bg); }
  .pricing-tool .tier-card.active::before { background: var(--accent); }

  .pricing-tool .tier-icon { font-size: 24px; margin-bottom: 8px; }
  .pricing-tool .tier-name { font-size: 16px; font-weight: 700; margin-bottom: 2px; color: var(--text); }
  .pricing-tool .tier-desc { font-size: 12px; color: var(--text-dim); margin-bottom: 10px; }

  .pricing-tool .tier-multiplier {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 20px;
    display: inline-block;
  }

  .pricing-tool .tier-multiplier.prod { background: rgba(59,130,246,0.12); color: var(--production); }
  .pricing-tool .tier-multiplier.cust { background: rgba(168,85,247,0.12); color: var(--custom); }
  .pricing-tool .tier-multiplier.prem { background: rgba(245,158,11,0.12); color: var(--premium); }

  .pricing-tool .active-badge {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 20px; height: 20px;
    border-radius: 50%;
    border: 2px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    transition: all 0.3s;
    color: transparent;
  }

  .pricing-tool .tier-card.active .active-badge {
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
  }

  .pricing-tool .project-info {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 24px;
    margin-bottom: 24px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
  }

  .pricing-tool .project-info .field label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    color: var(--text-muted);
    display: block;
    margin-bottom: 6px;
  }

  .pricing-tool .project-info .field input,
  .pricing-tool .project-info .field select {
    width: 100%;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 7px;
    padding: 10px 12px;
    color: var(--text);
    font-size: 13px;
    outline: none;
    transition: border-color 0.2s;
  }

  .pricing-tool .project-info .field input:focus,
  .pricing-tool .project-info .field select:focus {
    border-color: var(--accent);
  }

  .pricing-tool .col-headers {
    display: grid;
    grid-template-columns: 1fr 80px 100px 110px;
    gap: 12px;
    padding: 10px 20px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: var(--text-muted);
    border-bottom: 1px solid var(--border);
    margin-bottom: 4px;
  }

  .pricing-tool .section { margin-bottom: 4px; }

  .pricing-tool .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    cursor: pointer;
    user-select: none;
    transition: all 0.2s;
  }

  .pricing-tool .section-header:hover {
    background: var(--surface2);
    border-color: var(--accent-border);
  }

  .pricing-tool .section-header h2 {
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--text);
  }

  .pricing-tool .section-header .dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: var(--accent);
    transition: background 0.4s;
  }

  .pricing-tool .section-subtotal {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    font-weight: 700;
    color: var(--green);
  }

  .pricing-tool .chevron {
    color: var(--text-muted);
    transition: transform 0.3s;
    width: 16px;
    height: 16px;
  }

  .pricing-tool .section-header.open .chevron { transform: rotate(180deg); }

  .pricing-tool .section-body {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.4s ease;
    background: var(--surface);
    border: 1px solid var(--border);
    border-top: none;
    border-radius: 0 0 var(--radius) var(--radius);
  }

  .pricing-tool .section-body.open { max-height: 3000px; }

  .pricing-tool .fixture-row {
    display: grid;
    grid-template-columns: 1fr 80px 100px 110px;
    gap: 12px;
    align-items: center;
    padding: 11px 20px;
    border-bottom: 1px solid rgba(42,48,59,0.5);
    transition: background 0.15s;
  }

  .pricing-tool .fixture-row:hover { background: var(--surface2); }
  .pricing-tool .fixture-row:last-child { border-bottom: none; }

  .pricing-tool .fixture-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--text);
  }

  .pricing-tool .fixture-name .fdesc {
    font-size: 11px;
    color: var(--text-muted);
    margin-top: 1px;
  }

  .pricing-tool .fixture-row input[type="number"] {
    width: 100%;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 7px 8px;
    color: var(--text);
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    text-align: center;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .pricing-tool .fixture-row input[type="number"]:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-bg);
  }

  .pricing-tool .fixture-price {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: var(--text-dim);
    text-align: right;
  }

  .pricing-tool .fixture-line-total {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-muted);
    text-align: right;
    transition: color 0.2s;
  }

  .pricing-tool .fixture-line-total.has-value { color: var(--green); }

  .pricing-tool .adders-section {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 20px;
    margin-top: 20px;
    margin-bottom: 20px;
  }

  .pricing-tool .adders-section h3 {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: var(--orange);
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .pricing-tool .adder-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px solid var(--border);
  }

  .pricing-tool .adder-row:last-child { border-bottom: none; }

  .pricing-tool .adder-row label {
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    color: var(--text);
  }

  .pricing-tool .adder-row input[type="checkbox"] {
    accent-color: var(--accent);
    width: 16px; height: 16px;
  }

  .pricing-tool .adder-amount {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: var(--orange);
    font-weight: 600;
  }

  .pricing-tool .summary-footer {
    background: rgba(18,21,26,0.95);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 16px 20px;
    margin-top: 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    position: sticky;
    bottom: 16px;
    backdrop-filter: blur(20px);
  }

  .pricing-tool .summary-left {
    display: flex;
    gap: 20px;
    font-size: 12px;
    color: var(--text-dim);
  }

  .pricing-tool .s-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .pricing-tool .s-label {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--text-muted);
  }

  .pricing-tool .s-val {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
  }

  .pricing-tool .summary-right {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .pricing-tool .tier-badge {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    padding: 5px 12px;
    border-radius: 20px;
    background: var(--accent-bg);
    color: var(--accent);
    border: 1px solid var(--accent-border);
    transition: all 0.4s;
  }

  .pricing-tool .grand-total {
    font-family: 'JetBrains Mono', monospace;
    font-size: 26px;
    font-weight: 700;
    color: var(--green);
  }

  .pricing-tool .btn-generate {
    background: var(--accent);
    color: #fff;
    border: none;
    padding: 12px 22px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.25s;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .pricing-tool .btn-generate:hover {
    filter: brightness(1.15);
    transform: translateY(-1px);
  }

  .pricing-tool .modal-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.75);
    z-index: 200;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }

  .pricing-tool .modal-overlay.show { display: flex; }

  .pricing-tool .modal {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    max-width: 680px;
    width: 100%;
    max-height: 85vh;
    overflow-y: auto;
    padding: 32px;
  }

  .pricing-tool .modal h2 {
    font-size: 18px;
    margin-bottom: 4px;
    color: var(--text);
  }

  .pricing-tool .modal-subtitle {
    font-size: 13px;
    color: var(--text-dim);
    margin-bottom: 20px;
  }

  .pricing-tool .modal pre {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 20px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    line-height: 1.8;
    white-space: pre-wrap;
    color: var(--text);
    margin-bottom: 20px;
    max-height: 55vh;
    overflow-y: auto;
  }

  .pricing-tool .modal-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }

  .pricing-tool .modal-actions button {
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid var(--border);
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .pricing-tool .btn-copy { background: var(--green); color: #fff; border-color: var(--green) !important; }
  .pricing-tool .btn-close-modal { background: var(--surface2); color: var(--text); }

  @media (max-width: 768px) {
    .pricing-tool .project-info { grid-template-columns: 1fr 1fr; }
    .pricing-tool .tier-selector { grid-template-columns: 1fr; }
    .pricing-tool .fixture-row { grid-template-columns: 1fr 60px 75px 85px; gap: 6px; padding: 10px 12px; }
    .pricing-tool .col-headers { grid-template-columns: 1fr 60px 75px 85px; gap: 6px; padding: 8px 12px; }
    .pricing-tool .summary-left { display: none; }
  }
`;

export default function PricingTool() {
  const toast = useToast();
  const [currentTier, setCurrentTier] = useState<TierKey>('production');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [showModal, setShowModal] = useState(false);

  // Project info
  const [projectInfo, setProjectInfo] = useState({
    builder: 'Lennar - Brookstone Collection',
    subdivision: 'Lakewood Hills - Lewisville, TX',
    address: '3396 Edgecreek Path',
    plan: '3753 C4 L',
    bathConfig: '3.5 Bath',
    gasElectric: 'GAS',
  });

  // Initialize quantities from default values
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    fixtureData.forEach((section) => {
      section.items.forEach((item) => {
        initial[item.id] = item.defaultQty;
      });
    });
    return initial;
  });

  // Initialize adders from default values
  const [adders, setAdders] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    addersData.forEach((adder) => {
      initial[adder.id] = adder.defaultChecked;
    });
    return initial;
  });

  const multiplier = TIERS[currentTier].mult;

  // Calculate totals
  const calculations = useMemo(() => {
    let fixturesTotal = 0;
    const sectionTotals: Record<string, number> = {};

    fixtureData.forEach((section) => {
      let sectionTotal = 0;
      section.items.forEach((item) => {
        const qty = quantities[item.id] || 0;
        const lineTotal = item.base * qty * multiplier;
        sectionTotal += lineTotal;
      });
      sectionTotals[section.section] = sectionTotal;
      fixturesTotal += sectionTotal;
    });

    let addersTotal = 0;
    addersData.forEach((adder) => {
      if (adders[adder.id]) {
        addersTotal += adder.amount;
      }
    });

    const grandTotal = fixturesTotal + addersTotal;

    return { fixturesTotal, addersTotal, grandTotal, sectionTotals };
  }, [quantities, adders, multiplier]);

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleQuantityChange = (id: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setQuantities((prev) => ({ ...prev, [id]: Math.max(0, numValue) }));
  };

  const handleAdderChange = (id: string) => {
    setAdders((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
  };

  const generateEstimateText = useCallback(() => {
    const lines: string[] = [];
    lines.push('═══════════════════════════════════════════════════════');
    lines.push('           CTL PLUMBING — BID ESTIMATE');
    lines.push('═══════════════════════════════════════════════════════');
    lines.push('');
    lines.push(`Builder:      ${projectInfo.builder}`);
    lines.push(`Subdivision:  ${projectInfo.subdivision}`);
    lines.push(`Address:      ${projectInfo.address}`);
    lines.push(`Plan #:       ${projectInfo.plan}`);
    lines.push(`Config:       ${projectInfo.bathConfig} | ${projectInfo.gasElectric}`);
    lines.push(`Pricing Tier: ${TIERS[currentTier].label} (${multiplier}×)`);
    lines.push('');
    lines.push('───────────────────────────────────────────────────────');
    lines.push('FIXTURE BREAKDOWN');
    lines.push('───────────────────────────────────────────────────────');

    fixtureData.forEach((section) => {
      const sectionTotal = calculations.sectionTotals[section.section];
      if (sectionTotal > 0) {
        lines.push('');
        lines.push(`▸ ${section.section.toUpperCase()}`);
        section.items.forEach((item) => {
          const qty = quantities[item.id] || 0;
          if (qty > 0) {
            const unitPrice = item.base * multiplier;
            const lineTotal = unitPrice * qty;
            lines.push(`  ${qty}× ${item.name.padEnd(28)} ${formatCurrency(lineTotal).padStart(12)}`);
          }
        });
        lines.push(`  ${''.padEnd(28)} ──────────`);
        lines.push(`  ${'Section Total:'.padEnd(28)} ${formatCurrency(sectionTotal).padStart(12)}`);
      }
    });

    lines.push('');
    lines.push('───────────────────────────────────────────────────────');
    lines.push('ADDERS / OPTIONS');
    lines.push('───────────────────────────────────────────────────────');

    addersData.forEach((adder) => {
      if (adders[adder.id] && adder.amount > 0) {
        lines.push(`  ✓ ${adder.name.padEnd(40)} ${formatCurrency(adder.amount).padStart(12)}`);
      }
    });

    lines.push('');
    lines.push('═══════════════════════════════════════════════════════');
    lines.push(`  FIXTURES TOTAL:                         ${formatCurrency(calculations.fixturesTotal).padStart(12)}`);
    lines.push(`  ADDERS TOTAL:                           ${formatCurrency(calculations.addersTotal).padStart(12)}`);
    lines.push('───────────────────────────────────────────────────────');
    lines.push(`  GRAND TOTAL:                            ${formatCurrency(calculations.grandTotal).padStart(12)}`);
    lines.push('═══════════════════════════════════════════════════════');
    lines.push('');
    lines.push(`Generated: ${new Date().toLocaleString()}`);

    return lines.join('\n');
  }, [projectInfo, currentTier, multiplier, quantities, adders, calculations]);

  const copyEstimate = () => {
    navigator.clipboard.writeText(generateEstimateText());
    toast.success('Copied!', 'Estimate copied to clipboard');
  };

  return (
    <>
      <style>{styles}</style>
      <div className={`pricing-tool tier-${currentTier}`}>
        {/* Top Bar */}
        <div className="top-bar">
          <div className="brand">
            <div className="logo-mark">CTL</div>
            <h1>CTL Plumbing <span>Bid Tool</span></h1>
          </div>
          <div className="top-total">{formatCurrency(calculations.grandTotal)}</div>
        </div>

        <div style={{ padding: '24px 16px 160px' }}>
          {/* Tier Selector */}
          <div className="tier-selector">
            {(Object.keys(TIERS) as TierKey[]).map((tier) => (
              <div
                key={tier}
                className={`tier-card ${currentTier === tier ? 'active' : ''}`}
                onClick={() => setCurrentTier(tier)}
              >
                <div className="active-badge">{currentTier === tier ? '✓' : ''}</div>
                <div className="tier-icon">{TIERS[tier].icon}</div>
                <div className="tier-name">{TIERS[tier].label}</div>
                <div className="tier-desc">{TIERS[tier].desc}</div>
                <span className={`tier-multiplier ${tier.slice(0, 4)}`}>
                  {tier === 'production' ? 'Base Price — ' : tier === 'custom' ? '+25% — ' : '+56.25% — '}
                  {TIERS[tier].mult}×
                </span>
              </div>
            ))}
          </div>

          {/* Project Info */}
          <div className="project-info">
            <div className="field">
              <label>Builder</label>
              <input
                type="text"
                value={projectInfo.builder}
                onChange={(e) => setProjectInfo((p) => ({ ...p, builder: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>Subdivision</label>
              <input
                type="text"
                value={projectInfo.subdivision}
                onChange={(e) => setProjectInfo((p) => ({ ...p, subdivision: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>Address / Lot</label>
              <input
                type="text"
                value={projectInfo.address}
                onChange={(e) => setProjectInfo((p) => ({ ...p, address: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>Plan #</label>
              <input
                type="text"
                value={projectInfo.plan}
                onChange={(e) => setProjectInfo((p) => ({ ...p, plan: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>Bath Config</label>
              <select
                value={projectInfo.bathConfig}
                onChange={(e) => setProjectInfo((p) => ({ ...p, bathConfig: e.target.value }))}
              >
                <option>2 Bath</option>
                <option>2.5 Bath</option>
                <option>3 Bath</option>
                <option>3.5 Bath</option>
                <option>4 Bath</option>
                <option>4.5 Bath</option>
                <option>5 Bath</option>
              </select>
            </div>
            <div className="field">
              <label>Gas / Electric</label>
              <select
                value={projectInfo.gasElectric}
                onChange={(e) => setProjectInfo((p) => ({ ...p, gasElectric: e.target.value }))}
              >
                <option value="GAS">Gas</option>
                <option value="ELECTRIC">Electric</option>
              </select>
            </div>
          </div>

          {/* Column Headers */}
          <div className="col-headers">
            <div>Fixture</div>
            <div style={{ textAlign: 'center' }}>Qty</div>
            <div style={{ textAlign: 'right' }}>Unit Price</div>
            <div style={{ textAlign: 'right' }}>Line Total</div>
          </div>

          {/* Sections */}
          {fixtureData.map((section) => {
            const isOpen = openSections[section.section] ?? false;
            const sectionTotal = calculations.sectionTotals[section.section];

            return (
              <div key={section.section} className="section">
                <div
                  className={`section-header ${isOpen ? 'open' : ''}`}
                  onClick={() => toggleSection(section.section)}
                >
                  <h2>
                    <span className="dot" />
                    {section.section}
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="section-subtotal">{formatCurrency(sectionTotal)}</span>
                    <ChevronDownIcon className="chevron" />
                  </div>
                </div>
                <div className={`section-body ${isOpen ? 'open' : ''}`}>
                  {section.items.map((item) => {
                    const qty = quantities[item.id] || 0;
                    const unitPrice = item.base * multiplier;
                    const lineTotal = unitPrice * qty;

                    return (
                      <div key={item.id} className="fixture-row">
                        <div className="fixture-name">
                          {item.name}
                          <div className="fdesc">{item.desc}</div>
                        </div>
                        <input
                          type="number"
                          min="0"
                          value={qty || ''}
                          onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                        />
                        <div className="fixture-price">{formatCurrency(unitPrice)}</div>
                        <div className={`fixture-line-total ${lineTotal > 0 ? 'has-value' : ''}`}>
                          {formatCurrency(lineTotal)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Adders */}
          <div className="adders-section">
            <h3>⚡ Adders / Options</h3>
            {addersData.map((adder) => (
              <div key={adder.id} className="adder-row">
                <label>
                  <input
                    type="checkbox"
                    checked={adders[adder.id] || false}
                    onChange={() => handleAdderChange(adder.id)}
                  />
                  {adder.name}
                </label>
                <span className="adder-amount">
                  {adder.amount > 0 ? formatCurrency(adder.amount) : 'Included'}
                </span>
              </div>
            ))}
          </div>

          {/* Summary Footer */}
          <div className="summary-footer">
            <div className="summary-left">
              <div className="s-item">
                <span className="s-label">Fixtures</span>
                <span className="s-val">{formatCurrency(calculations.fixturesTotal)}</span>
              </div>
              <div className="s-item">
                <span className="s-label">Adders</span>
                <span className="s-val">{formatCurrency(calculations.addersTotal)}</span>
              </div>
            </div>
            <div className="summary-right">
              <span className="tier-badge">{TIERS[currentTier].short}</span>
              <div className="grand-total">{formatCurrency(calculations.grandTotal)}</div>
              <button className="btn-generate" onClick={() => setShowModal(true)}>
                <ClipboardDocumentIcon style={{ width: 18, height: 18 }} />
                Generate Estimate
              </button>
            </div>
          </div>
        </div>

        {/* Modal */}
        <div className={`modal-overlay ${showModal ? 'show' : ''}`} onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>📋 Estimate Summary</h2>
            <p className="modal-subtitle">Ready to copy and send to builder</p>
            <pre>{generateEstimateText()}</pre>
            <div className="modal-actions">
              <button className="btn-close-modal" onClick={() => setShowModal(false)}>
                <XMarkIcon style={{ width: 16, height: 16 }} />
                Close
              </button>
              <button className="btn-copy" onClick={copyEstimate}>
                <ClipboardDocumentIcon style={{ width: 16, height: 16 }} />
                Copy to Clipboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
