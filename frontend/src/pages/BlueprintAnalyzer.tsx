import { useRef, useCallback } from 'react';
import { BlueprintCanvas, AnalysisPanel, AnalyzeOverlay } from '../components/blueprint-analyzer';
import { useBlueprintAnalyzerStore } from '../stores/blueprintAnalyzerStore';

export default function BlueprintAnalyzer() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { startAnalysis, setFileUploaded } = useBlueprintAnalyzerStore();

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setFileUploaded(true, file.name);
        // Auto-trigger analysis after upload
        setTimeout(() => startAnalysis(), 500);
      }
    },
    [setFileUploaded, startAnalysis]
  );

  const handleRunAnalysis = useCallback(() => {
    startAnalysis();
  }, [startAnalysis]);

  return (
    <>
      {/* Top Action Bar */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Blueprint Analyzer</h1>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
            <span>PlansiteOS</span>
            <span className="text-slate-700">›</span>
            <span className="text-cyan-400">Blueprint Analyzer</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-xs font-medium hover:border-cyan-500 hover:text-cyan-400 transition-all"
            onClick={handleUploadClick}
          >
            📄 Upload PDF
          </button>
          <button
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 border-none rounded-lg text-white text-xs font-semibold hover:shadow-lg hover:shadow-cyan-500/30 hover:-translate-y-0.5 transition-all cursor-pointer"
            onClick={handleRunAnalysis}
          >
            🧠 Analyze with AI
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4 flex-1 min-h-0">
        <BlueprintCanvas />
        <AnalysisPanel />
      </div>

      {/* Analysis Overlay */}
      <AnalyzeOverlay />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
        className="hidden"
        onChange={handleFileChange}
      />
    </>
  );
}
