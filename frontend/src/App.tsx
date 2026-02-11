import { useState, Suspense, lazy } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ToastContainer from './components/ui/Toast';
import CommandPalette from './components/CommandPalette';
import ShortcutsModal from './components/ShortcutsModal';
import { useKeyboard, usePreventDefaults } from './hooks/useKeyboard';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const BlueprintAnalyzer = lazy(() => import('./pages/BlueprintAnalyzer'));
const Blueprints = lazy(() => import('./pages/Blueprints'));
const BlueprintDetail = lazy(() => import('./pages/BlueprintDetail'));
const Estimates = lazy(() => import('./pages/Estimates'));
const ActiveJobs = lazy(() => import('./pages/ActiveJobs'));
const Leads = lazy(() => import('./pages/Leads'));
const Messages = lazy(() => import('./pages/Messages'));
const Reports = lazy(() => import('./pages/Reports'));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-slate-700 border-t-cyan-400 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500 font-mono">Loading...</p>
      </div>
    </div>
  );
}

export default function App() {
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const navigate = useNavigate();

  // Prevent default browser shortcuts
  usePreventDefaults();

  // Global keyboard shortcuts
  useKeyboard('mod+k', (e) => {
    e.preventDefault();
    setShowCommandPalette(true);
  });

  useKeyboard('shift+/', () => {
    setShowShortcuts(true);
  });

  useKeyboard('escape', () => {
    setShowCommandPalette(false);
    setShowShortcuts(false);
  });

  // Navigation shortcuts
  useKeyboard('mod+n', (e) => {
    e.preventDefault();
    navigate('/estimates');
  });

  useKeyboard('mod+u', (e) => {
    e.preventDefault();
    navigate('/blueprints');
  });

  useKeyboard('mod+l', (e) => {
    e.preventDefault();
    navigate('/leads');
  });

  useKeyboard('mod+j', (e) => {
    e.preventDefault();
    navigate('/jobs');
  });

  return (
    <>
      <Layout>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/analyzer" element={<BlueprintAnalyzer />} />
            <Route path="/blueprints" element={<Blueprints />} />
            <Route path="/blueprints/:id" element={<BlueprintDetail />} />
            <Route path="/estimates" element={<Estimates />} />
            <Route path="/jobs" element={<ActiveJobs />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </Suspense>
      </Layout>
      <ToastContainer />
      <CommandPalette open={showCommandPalette} onClose={() => setShowCommandPalette(false)} />
      <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </>
  );
}
