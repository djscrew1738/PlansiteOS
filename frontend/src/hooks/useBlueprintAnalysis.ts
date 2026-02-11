import { useCallback, useRef } from 'react';
import { useBlueprintAnalyzerStore } from '../stores/blueprintAnalyzerStore';
import { ANALYZE_STEPS, DEFAULT_ANALYSIS_RESULT } from '../lib/blueprintData';
import type { AnalysisResult, AnalyzeStep } from '../stores/blueprintAnalyzerStore';

interface UseBlueprintAnalysisOptions {
  /** Custom analysis steps to use instead of defaults */
  steps?: AnalyzeStep[];
  /** Custom analysis result to use instead of defaults */
  result?: AnalysisResult;
  /** Interval between steps in ms */
  stepInterval?: number;
  /** Delay after completion before resolving */
  completionDelay?: number;
  /** Callback when analysis completes */
  onComplete?: (result: AnalysisResult) => void;
  /** Callback when analysis fails */
  onError?: (error: Error) => void;
}

/**
 * Hook for managing blueprint AI analysis workflow.
 *
 * In production, this would integrate with the actual Ollama/AI backend.
 * Currently uses a step-by-step simulation with configurable timing.
 */
export function useBlueprintAnalysis(options: UseBlueprintAnalysisOptions = {}) {
  const {
    steps = ANALYZE_STEPS,
    result = DEFAULT_ANALYSIS_RESULT,
    stepInterval = 800,
    completionDelay = 600,
    onComplete,
    onError,
  } = options;

  const {
    isAnalyzing,
    analyzeProgress,
    analyzeStepText,
    analyzeSubText,
    hasAnalysisResult,
    analysisResult,
    startAnalysis,
    updateAnalysisProgress,
    completeAnalysis,
    cancelAnalysis,
  } = useBlueprintAnalyzerStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepIndexRef = useRef(0);

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    stepIndexRef.current = 0;
  }, []);

  const runAnalysis = useCallback(async () => {
    try {
      cleanup();
      startAnalysis();
      stepIndexRef.current = 0;

      return new Promise<AnalysisResult>((resolve, reject) => {
        intervalRef.current = setInterval(() => {
          if (stepIndexRef.current < steps.length) {
            updateAnalysisProgress(steps[stepIndexRef.current]);
            stepIndexRef.current++;
          } else {
            cleanup();
            setTimeout(() => {
              completeAnalysis(result);
              onComplete?.(result);
              resolve(result);
            }, completionDelay);
          }
        }, stepInterval);
      });
    } catch (error) {
      cleanup();
      cancelAnalysis();
      const err = error instanceof Error ? error : new Error('Analysis failed');
      onError?.(err);
      throw err;
    }
  }, [
    steps,
    result,
    stepInterval,
    completionDelay,
    onComplete,
    onError,
    startAnalysis,
    updateAnalysisProgress,
    completeAnalysis,
    cancelAnalysis,
    cleanup,
  ]);

  const cancel = useCallback(() => {
    cleanup();
    cancelAnalysis();
  }, [cleanup, cancelAnalysis]);

  return {
    // State
    isAnalyzing,
    progress: analyzeProgress,
    stepText: analyzeStepText,
    subText: analyzeSubText,
    hasResult: hasAnalysisResult,
    result: analysisResult,

    // Actions
    runAnalysis,
    cancel,
  };
}
