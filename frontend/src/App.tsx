import { Route, Routes, Link } from 'react-router-dom';
import NewProjectPage from './pages/NewProjectPage';
import ProjectPage from './pages/ProjectPage';
import UploadPage from './pages/UploadPage';
import PageViewer from './pages/PageViewer';
import PlumbingWorkspace from './pages/PlumbingWorkspace';
import PricingHistoryPage from './pages/PricingHistoryPage';
import QuickBooksPage from './pages/QuickBooksPage';

export default function App() {
  return (
    <div className="app-shell">
      <header>
        <h1>Blueprint Upload Foundation</h1>
        <nav>
          <Link to="/projects/new" style={{ color: '#fff' }}>New Project</Link>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/projects/new" element={<NewProjectPage />} />
          <Route path="/projects/:projectId" element={<ProjectPage />} />
          <Route path="/uploads/:uploadId" element={<UploadPage />} />
          <Route path="/pages/:pageId" element={<PageViewer />} />
          <Route path="/workspaces/:projectId/plumbing" element={<PlumbingWorkspace />} />
          <Route path="/projects/:projectId/pricing" element={<PricingHistoryPage />} />
          <Route path="/projects/:projectId/quickbooks" element={<QuickBooksPage />} />
        </Routes>
      </main>
    </div>
  );
}
