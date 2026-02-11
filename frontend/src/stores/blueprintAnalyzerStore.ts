// Zustand store for Blueprint Analyzer state
import { create } from 'zustand';

export type CanvasTool = 'pan' | 'select' | 'measure' | 'annotate' | 'fixture' | 'pipe';

export type PricingTier = 'production' | 'custom' | 'premium';

export interface MeasurePoint {
  id: string;
  x: number; // percentage of canvas
  y: number;
}

export interface Measurement {
  id: string;
  points: [MeasurePoint, MeasurePoint];
  label: string;
  description: string;
  valueFeet: string;
}

export interface DetectedFixture {
  type: string;
  location: string;
  quantity: number;
}

export interface AnalysisResult {
  summary: string;
  sqft: number;
  wetAreas: number;
  fixtureCount: number;
  supplyLineFeet: number;
  dwvFeet: number;
  fixtures: DetectedFixture[];
  tags: Array<{ label: string; variant: 'cyan' | 'orange' | 'green' }>;
  measurements: Measurement[];
}

export interface EstimateRow {
  name: string;
  cost: string;
}

export interface TierEstimate {
  rows: EstimateRow[];
  total: string;
}

export interface AnalyzeStep {
  text: string;
  sub: string;
  pct: number;
}

interface BlueprintAnalyzerState {
  // Canvas
  currentTool: CanvasTool;
  zoomLevel: number;
  scaleRatio: string;
  isFileUploaded: boolean;
  uploadedFileName: string | null;

  // Measurement
  measurePoints: MeasurePoint[];
  measurements: Measurement[];

  // Analysis
  isAnalyzing: boolean;
  analyzeProgress: number;
  analyzeStepText: string;
  analyzeSubText: string;
  hasAnalysisResult: boolean;
  analysisResult: AnalysisResult | null;

  // Estimate
  selectedTier: PricingTier;

  // Actions
  setTool: (tool: CanvasTool) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setScaleRatio: (scale: string) => void;
  setFileUploaded: (uploaded: boolean, fileName?: string) => void;

  addMeasurePoint: (point: MeasurePoint) => void;
  clearMeasurePoints: () => void;
  addMeasurement: (measurement: Measurement) => void;
  removeMeasurement: (id: string) => void;

  startAnalysis: () => void;
  updateAnalysisProgress: (step: AnalyzeStep) => void;
  completeAnalysis: (result: AnalysisResult) => void;
  cancelAnalysis: () => void;

  setSelectedTier: (tier: PricingTier) => void;
  reset: () => void;
}

const initialState = {
  currentTool: 'select' as CanvasTool,
  zoomLevel: 100,
  scaleRatio: '1/4" = 1\'',
  isFileUploaded: false,
  uploadedFileName: null as string | null,
  measurePoints: [] as MeasurePoint[],
  measurements: [] as Measurement[],
  isAnalyzing: false,
  analyzeProgress: 0,
  analyzeStepText: '',
  analyzeSubText: '',
  hasAnalysisResult: false,
  analysisResult: null as AnalysisResult | null,
  selectedTier: 'custom' as PricingTier,
};

export const useBlueprintAnalyzerStore = create<BlueprintAnalyzerState>()((set, get) => ({
  ...initialState,

  setTool: (tool) => set({ currentTool: tool }),

  zoomIn: () =>
    set((state) => ({
      zoomLevel: Math.min(state.zoomLevel + 15, 200),
    })),

  zoomOut: () =>
    set((state) => ({
      zoomLevel: Math.max(state.zoomLevel - 15, 50),
    })),

  setScaleRatio: (scale) => set({ scaleRatio: scale }),

  setFileUploaded: (uploaded, fileName) =>
    set({
      isFileUploaded: uploaded,
      uploadedFileName: fileName || null,
    }),

  addMeasurePoint: (point) => {
    const current = get().measurePoints;
    if (current.length < 2) {
      set({ measurePoints: [...current, point] });
    }
    if (current.length === 1) {
      // Two points - create measurement
      const p1 = current[0];
      const p2 = point;
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const pixels = Math.sqrt(dx * dx + dy * dy);
      const feet = (pixels * 0.35).toFixed(1);

      const measurement: Measurement = {
        id: crypto.randomUUID(),
        points: [p1, p2],
        label: `${feet}' est.`,
        description: `Point measurement`,
        valueFeet: `${feet}'`,
      };

      set((state) => ({
        measurements: [...state.measurements, measurement],
        measurePoints: [],
      }));
    }
  },

  clearMeasurePoints: () => set({ measurePoints: [] }),

  addMeasurement: (measurement) =>
    set((state) => ({
      measurements: [...state.measurements, measurement],
    })),

  removeMeasurement: (id) =>
    set((state) => ({
      measurements: state.measurements.filter((m) => m.id !== id),
    })),

  startAnalysis: () =>
    set({
      isAnalyzing: true,
      analyzeProgress: 0,
      analyzeStepText: 'Initializing Ollama AI...',
      analyzeSubText: 'Loading Llama 3.1 8B model',
    }),

  updateAnalysisProgress: (step) =>
    set({
      analyzeProgress: step.pct,
      analyzeStepText: step.text,
      analyzeSubText: step.sub,
    }),

  completeAnalysis: (result) =>
    set({
      isAnalyzing: false,
      analyzeProgress: 100,
      hasAnalysisResult: true,
      analysisResult: result,
      isFileUploaded: true,
    }),

  cancelAnalysis: () =>
    set({
      isAnalyzing: false,
      analyzeProgress: 0,
      analyzeStepText: '',
      analyzeSubText: '',
    }),

  setSelectedTier: (tier) => set({ selectedTier: tier }),

  reset: () => set(initialState),
}));
