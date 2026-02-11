import { useBlueprintAnalyzerStore } from '../../stores/blueprintAnalyzerStore';
import { DEFAULT_ANALYSIS_RESULT } from '../../lib/blueprintData';
import AISummaryPanel from './AISummaryPanel';
import FixturesPanel from './FixturesPanel';
import QuickEstimatePanel from './QuickEstimatePanel';
import MeasurementsPanel from './MeasurementsPanel';

export default function AnalysisPanel() {
  const { hasAnalysisResult, analysisResult, measurements } = useBlueprintAnalyzerStore();

  // Use analysis result or default data for display
  const result = analysisResult || DEFAULT_ANALYSIS_RESULT;

  // Combine analysis measurements + user measurements
  const allMeasurements = [
    ...(result.measurements || []),
    ...measurements,
  ];

  return (
    <div className="flex flex-col gap-3 overflow-y-auto max-h-[calc(100vh-120px)] pr-1 scrollbar-thin">
      <AISummaryPanel result={result} />
      <FixturesPanel fixtures={result.fixtures} />
      <QuickEstimatePanel />
      <MeasurementsPanel measurements={allMeasurements} />
    </div>
  );
}
