import { useState, Suspense, lazy } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingScreen from './components/LoadingScreen';
import ToastContainer from './components/ui/Toast';
import CommandPalette from './components/CommandPalette';
import ShortcutsModal from './components/ShortcutsModal';
import OfflineBanner from './components/OfflineBanner';
import { useKeyboard, usePreventDefaults } from './hooks/useKeyboard';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Blueprints = lazy(() => import('./pages/Blueprints'));
const BlueprintDetail = lazy(() => import('./pages/BlueprintDetail'));
const Estimates = lazy(() => import('./pages/Estimates'));
const Leads = lazy(() => import('./pages/Leads'));
const Messages = lazy(() => import('./pages/Messages'));
const Reports = lazy(() => import('./pages/Reports'));
const NotFound = lazy(() => import('./pages/NotFound'));

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

  return (
    <ErrorBoundary>
      <OfflineBanner />
      <Layout>
        <Suspense fallback={<LoadingScreen />}>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/blueprints" element={<Blueprints />} />
              <Route path="/blueprints/:id" element={<BlueprintDetail />} />
              <Route path="/estimates" element={<Estimates />} />
              <Route path="/leads" element={<Leads />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
        </Suspense>
      </Layout>
      <ToastContainer />
      <CommandPalette open={showCommandPalette} onClose={() => setShowCommandPalette(false)} />
      <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </ErrorBoundary>
  );
}
