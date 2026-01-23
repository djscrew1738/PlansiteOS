import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Blueprints from './pages/Blueprints';
import Estimates from './pages/Estimates';
import Leads from './pages/Leads';
import Messages from './pages/Messages';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/blueprints" element={<Blueprints />} />
        <Route path="/estimates" element={<Estimates />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/messages" element={<Messages />} />
      </Routes>
    </Layout>
  );
}
