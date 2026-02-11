import { useEffect, useRef, useCallback } from 'react';
import { useBlueprintAnalyzerStore } from '../../stores/blueprintAnalyzerStore';
import { ANALYZE_STEPS, DEFAULT_ANALYSIS_RESULT } from '../../lib/blueprintData';

export default function AnalyzeOverlay() {
  const {
    isAnalyzing,
    analyzeProgress,
    analyzeStepText,
    analyzeSubText,
    updateAnalysisProgress,
    completeAnalysis,
    cancelAnalysis,
  } = useBlueprintAnalyzerStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepRef = useRef(0);

  const startSteps = useCallback(() => {
    stepRef.current = 0;
    intervalRef.current = setInterval(() => {
      if (stepRef.current < ANALYZE_STEPS.length) {
        updateAnalysisProgress(ANALYZE_STEPS[stepRef.current]);
        stepRef.current++;
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setTimeout(() => {
          completeAnalysis(DEFAULT_ANALYSIS_RESULT);
        }, 600);
      }
    }, 800);
  }, [updateAnalysisProgress, completeAnalysis]);

  useEffect(() => {
    if (isAnalyzing) {
      startSteps();
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAnalyzing, startSteps]);

  if (!isAnalyzing) return null;

  return (
    <div className="fixed inset-0 z-[500] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center">
      <div className="text-center animate-fadeIn">
        {/* Spinner */}
        <div className="w-16 h-16 border-[3px] border-slate-700 border-t-cyan-400 rounded-full animate-spin mx-auto mb-6" />

        {/* Step Text */}
        <div className="font-mono text-sm text-cyan-400 mb-2">{analyzeStepText}</div>
        <div className="text-[13px] text-slate-500">{analyzeSubText}</div>

        {/* Progress Bar */}
        <div className="w-[300px] h-0.5 bg-slate-700 rounded-full mt-5 mx-auto overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${analyzeProgress}%` }}
          />
        </div>

        {/* Cancel Button */}
        <button
          className="mt-6 text-xs text-slate-500 hover:text-slate-300 transition-colors bg-transparent border-none cursor-pointer"
          onClick={cancelAnalysis}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
