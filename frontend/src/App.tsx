import { Route, Routes, Link } from 'react-router-dom';
import NewProjectPage from './pages/NewProjectPage';
import ProjectPage from './pages/ProjectPage';
import UploadPage from './pages/UploadPage';
import PageViewer from './pages/PageViewer';

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
        </Routes>
      </main>
    </div>
  );
}
