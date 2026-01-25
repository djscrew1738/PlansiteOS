import { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Blueprints from './pages/Blueprints';
import BlueprintDetail from './pages/BlueprintDetail';
import Estimates from './pages/Estimates';
import Leads from './pages/Leads';
import Messages from './pages/Messages';
import Reports from './pages/Reports';
import ToastContainer from './components/ui/Toast';
import CommandPalette from './components/CommandPalette';
import ShortcutsModal from './components/ShortcutsModal';
import { useKeyboard, usePreventDefaults } from './hooks/useKeyboard';

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
    <>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/blueprints" element={<Blueprints />} />
          <Route path="/blueprints/:id" element={<BlueprintDetail />} />
          <Route path="/estimates" element={<Estimates />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </Layout>
      <ToastContainer />
      <CommandPalette open={showCommandPalette} onClose={() => setShowCommandPalette(false)} />
      <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </>
  );
}
