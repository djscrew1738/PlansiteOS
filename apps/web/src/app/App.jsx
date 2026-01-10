import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../components/dashboard/DashboardLayout.improved';
import Dashboard from '../pages/Dashboard.improved';
import Blueprints from '../pages/Blueprints.improved';
import BlueprintDetail from '../pages/BlueprintDetail.improved';
import Leads from '../pages/Leads';
import Bids from '../pages/Bids';
import BidDetail from '../pages/BidDetail';
import Analytics from '../pages/Analytics.improved';
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
        <Route path="bids/:id" element={<BidDetail />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
