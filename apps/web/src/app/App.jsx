import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import Dashboard from '../pages/Dashboard';
import Blueprints from '../pages/Blueprints';
import BlueprintDetail from '../pages/BlueprintDetail';
import Leads from '../pages/Leads';
import Bids from '../pages/Bids';
import Analytics from '../pages/Analytics';
import Settings from '../pages/Settings';

function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="blueprints" element={<Blueprints />} />
        <Route path="blueprints/:id" element={<BlueprintDetail />} />
        <Route path="leads" element={<Leads />} />
        <Route path="bids" element={<Bids />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
