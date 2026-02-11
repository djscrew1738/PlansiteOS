// Blueprint Analyzer data constants
import type { AnalyzeStep, AnalysisResult, TierEstimate, DetectedFixture, Measurement } from '../stores/blueprintAnalyzerStore';

// ===== AI Analysis Steps =====
export const ANALYZE_STEPS: AnalyzeStep[] = [
  { text: 'Initializing Ollama AI...', sub: 'Loading Llama 3.1 8B model', pct: 10 },
  { text: 'Processing PDF blueprint...', sub: 'Extracting vector data and dimensions', pct: 25 },
  { text: 'Detecting room boundaries...', sub: 'Found 4 rooms with plumbing requirements', pct: 40 },
  { text: 'Identifying fixtures...', sub: 'Detected 11 plumbing fixtures across plan', pct: 55 },
  { text: 'Calculating pipe runs...', sub: 'Estimating 145 LF supply, 92 LF DWV', pct: 70 },
  { text: 'Generating cost estimate...', sub: 'Applying Custom tier pricing from CTL database', pct: 85 },
  { text: 'Building AI summary...', sub: 'Compiling analysis report', pct: 95 },
  { text: 'Analysis complete!', sub: '11 fixtures · 4 wet areas · $15,500 estimated', pct: 100 },
];

// ===== Default Analysis Result =====
export const DEFAULT_ANALYSIS_RESULT: AnalysisResult = {
  summary:
    'Residential new-construction floor plan — single-story, approx 2,100 sqft. Identified 4 wet areas: master bath, hall bath, kitchen, and utility/laundry. Total of 11 plumbing fixtures detected. Estimated 145 linear feet of supply line and 92 linear feet of DWV. The master bath is the most complex wet wall with tub, shower, WC, and dual lavatory on a shared stack.',
  sqft: 2100,
  wetAreas: 4,
  fixtureCount: 11,
  supplyLineFeet: 145,
  dwvFeet: 92,
  fixtures: [
    { type: 'Water Closet (WC)', location: 'Master, Bath 2', quantity: 2 },
    { type: 'Lavatory', location: 'Master, Bath 2', quantity: 2 },
    { type: 'Bathtub', location: 'Master, Bath 2', quantity: 2 },
    { type: 'Shower Stall', location: 'Master', quantity: 1 },
    { type: 'Kitchen Sink', location: 'Kitchen', quantity: 1 },
    { type: 'Dishwasher', location: 'Kitchen', quantity: 1 },
    { type: 'Washer/Dryer', location: 'Utility', quantity: 1 },
    { type: 'Utility Sink', location: 'Utility', quantity: 1 },
  ],
  tags: [
    { label: 'New Construction', variant: 'cyan' },
    { label: 'Single Story', variant: 'cyan' },
    { label: '11 Fixtures', variant: 'orange' },
    { label: '4 Wet Areas', variant: 'green' },
  ],
  measurements: [
    {
      id: '1',
      points: [
        { id: 'a', x: 12, y: 14 },
        { id: 'b', x: 42, y: 14 },
      ],
      label: "12' 6\"",
      description: 'Master Bath width',
      valueFeet: "12' 6\"",
    },
    {
      id: '2',
      points: [
        { id: 'c', x: 55, y: 53 },
        { id: 'd', x: 95, y: 53 },
      ],
      label: "18' 0\"",
      description: 'Kitchen length',
      valueFeet: "18' 0\"",
    },
    {
      id: '3',
      points: [
        { id: 'e', x: 30, y: 40 },
        { id: 'f', x: 70, y: 40 },
      ],
      label: "24' 3\"",
      description: 'Main stack to Kitchen',
      valueFeet: "24' 3\"",
    },
    {
      id: '4',
      points: [
        { id: 'g', x: 15, y: 55 },
        { id: 'h', x: 50, y: 55 },
      ],
      label: "8' 4\"",
      description: 'Bath 2 wet wall',
      valueFeet: "8' 4\"",
    },
    {
      id: '5',
      points: [
        { id: 'i', x: 55, y: 60 },
        { id: 'j', x: 90, y: 60 },
      ],
      label: "6' 2\"",
      description: 'Utility run to exterior',
      valueFeet: "6' 2\"",
    },
  ],
};

// ===== Tier Pricing =====
export const TIER_ESTIMATES: Record<string, TierEstimate> = {
  production: {
    rows: [
      { name: 'Rough-In Labor', cost: '$3,600' },
      { name: 'Top-Out Labor', cost: '$1,600' },
      { name: 'Trim-Out Labor', cost: '$1,200' },
      { name: 'Supply Material (PEX)', cost: '$1,200' },
      { name: 'DWV Material (PVC)', cost: '$1,080' },
      { name: 'Fixture Allowance', cost: '$1,800' },
      { name: 'Gas Line (if appl.)', cost: '$500' },
      { name: 'Permits & Inspections', cost: '$420' },
    ],
    total: '$11,400',
  },
  custom: {
    rows: [
      { name: 'Rough-In Labor', cost: '$4,800' },
      { name: 'Top-Out Labor', cost: '$2,200' },
      { name: 'Trim-Out Labor', cost: '$1,800' },
      { name: 'Supply Material (PEX)', cost: '$1,450' },
      { name: 'DWV Material (PVC)', cost: '$1,280' },
      { name: 'Fixture Allowance', cost: '$2,850' },
      { name: 'Gas Line (if appl.)', cost: '$650' },
      { name: 'Permits & Inspections', cost: '$470' },
    ],
    total: '$15,500',
  },
  premium: {
    rows: [
      { name: 'Rough-In Labor', cost: '$6,200' },
      { name: 'Top-Out Labor', cost: '$2,800' },
      { name: 'Trim-Out Labor', cost: '$2,400' },
      { name: 'Supply Material (PEX)', cost: '$1,900' },
      { name: 'DWV Material (PVC)', cost: '$1,580' },
      { name: 'Fixture Allowance', cost: '$5,200' },
      { name: 'Gas Line (if appl.)', cost: '$850' },
      { name: 'Permits & Inspections', cost: '$570' },
    ],
    total: '$21,500',
  },
};

// ===== Jobs Data =====
export interface Job {
  id: string;
  name: string;
  builder: string;
  phase: string;
  phaseVariant: 'orange' | 'green' | 'cyan';
  progress: number;
  value: string;
  startDate: string;
  dueDate: string;
}

export const JOBS_DATA: Job[] = [
  {
    id: '1',
    name: '6001 Grayson St — Duplex',
    builder: 'Westridge Homes',
    phase: 'Rough-In',
    phaseVariant: 'orange',
    progress: 35,
    value: '$28,500',
    startDate: 'Feb 3',
    dueDate: 'Feb 28',
  },
  {
    id: '2',
    name: '2200 8th Ave — Fourplex',
    builder: 'Cedar Hill Group',
    phase: 'Top-Out',
    phaseVariant: 'green',
    progress: 60,
    value: '$52,000',
    startDate: 'Jan 20',
    dueDate: 'Mar 5',
  },
  {
    id: '3',
    name: '7720 Westcliff — Custom Home',
    builder: 'J&M Custom Builders',
    phase: 'Trim-Out',
    phaseVariant: 'green',
    progress: 85,
    value: '$22,000',
    startDate: 'Jan 8',
    dueDate: 'Feb 18',
  },
  {
    id: '4',
    name: '505 Henderson — Townhomes (×3)',
    builder: 'Metropolitan Dev',
    phase: 'Rough-In',
    phaseVariant: 'orange',
    progress: 20,
    value: '$41,000',
    startDate: 'Feb 5',
    dueDate: 'Mar 20',
  },
  {
    id: '5',
    name: '1900 Hemphill — SFH',
    builder: 'Pinnacle Builders',
    phase: 'Inspection',
    phaseVariant: 'cyan',
    progress: 95,
    value: '$13,200',
    startDate: 'Jan 15',
    dueDate: 'Feb 14',
  },
  {
    id: '6',
    name: '1422 Lipscomb St — SFH',
    builder: 'Urban South Dev',
    phase: 'Scheduled',
    phaseVariant: 'cyan',
    progress: 0,
    value: '$15,500',
    startDate: 'Mar 10',
    dueDate: 'Mar 28',
  },
];

// ===== Estimate Cards Data =====
export interface EstimateCardData {
  id: string;
  title: string;
  subtitle: string;
  status: 'approved' | 'sent' | 'draft' | 'declined';
  amount: string;
  tier: string;
  fixtures: string;
  timeline: string;
}

export const ESTIMATE_CARDS: EstimateCardData[] = [
  {
    id: '1',
    title: '6001 Grayson St — Duplex',
    subtitle: 'Builder: Westridge Homes',
    status: 'approved',
    amount: '$28,500',
    tier: 'Custom',
    fixtures: '22 fixtures',
    timeline: 'Sent 5 days ago',
  },
  {
    id: '2',
    title: '1422 Lipscomb St — SFH',
    subtitle: 'Builder: Urban South Dev',
    status: 'sent',
    amount: '$15,500',
    tier: 'Custom',
    fixtures: '11 fixtures',
    timeline: 'Sent 2 days ago',
  },
  {
    id: '3',
    title: '3808 Modlin Ave — SFH',
    subtitle: 'Builder: Pinnacle Builders',
    status: 'draft',
    amount: '$12,800',
    tier: 'Production',
    fixtures: '9 fixtures',
    timeline: 'Created today',
  },
  {
    id: '4',
    title: '910 W Magnolia — Triplex',
    subtitle: 'Builder: Fort Worth Equity',
    status: 'sent',
    amount: '$38,200',
    tier: 'Premium',
    fixtures: '33 fixtures',
    timeline: 'Sent 1 week ago',
  },
  {
    id: '5',
    title: '2200 8th Ave — Fourplex',
    subtitle: 'Builder: Cedar Hill Group',
    status: 'approved',
    amount: '$52,000',
    tier: 'Custom',
    fixtures: '44 fixtures',
    timeline: 'Approved 3 days ago',
  },
  {
    id: '6',
    title: '4600 Camp Bowie — Reno',
    subtitle: 'Direct Client',
    status: 'declined',
    amount: '$9,400',
    tier: 'Production',
    fixtures: '6 fixtures',
    timeline: 'Client went with other bid',
  },
];

// ===== Dashboard Stats =====
export interface DashboardStat {
  label: string;
  value: string;
  delta: string;
  color: 'cyan' | 'green' | 'orange' | 'purple';
}

export const DASHBOARD_STATS: DashboardStat[] = [
  { label: 'Revenue (This Month)', value: '$67.8k', delta: '↑ 12% vs last month', color: 'cyan' },
  { label: 'Active Jobs', value: '6', delta: '2 starting this week', color: 'green' },
  { label: 'Plans Analyzed (AI)', value: '34', delta: '↑ 12 this month', color: 'orange' },
  { label: 'Bids Pending', value: '5', delta: '$84.5k total value', color: 'purple' },
];

export const ESTIMATES_STATS: DashboardStat[] = [
  { label: 'Total Bids (This Month)', value: '12', delta: '↑ 4 from last month', color: 'cyan' },
  { label: 'Win Rate', value: '72%', delta: '↑ 8% improvement', color: 'green' },
  { label: 'Pending Value', value: '$84.5k', delta: '5 awaiting response', color: 'orange' },
  { label: 'Avg Estimate', value: '$14.2k', delta: '↑ per-job revenue', color: 'purple' },
];
