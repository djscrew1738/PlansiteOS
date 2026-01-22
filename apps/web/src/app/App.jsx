import { Routes, Route, Navigate } from 'react-router-dom';
import TabbedLayout from '../components/layout/TabbedLayout';
import Dashboard from '../pages/Dashboard.improved';
import Messages from '../pages/Messages';
import Blueprints from '../pages/Blueprints.improved';
import BlueprintDetail from '../pages/BlueprintDetail.improved';
import Estimates from '../pages/Estimates';
import BidDetail from '../pages/BidDetail';
import Material from '../pages/Material';
import Leads from '../pages/Leads';
import Settings from '../pages/Settings';

function App() {
  return (
    <Routes>
      <Route path="/" element={<TabbedLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="messages" element={<Messages />} />
        <Route path="blueprints" element={<Blueprints />} />
        <Route path="blueprints/:id" element={<BlueprintDetail />} />
        <Route path="estimates" element={<Estimates />} />
        <Route path="estimates/:id" element={<BidDetail />} />
        <Route path="leads" element={<Leads />} />
        <Route path="settings" element={<Settings />} />
        {/* Legacy redirects */}
        <Route path="bids/*" element={<Navigate to="/estimates" replace />} />
        <Route path="material" element={<Navigate to="/leads" replace />} />
        <Route path="analytics" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
