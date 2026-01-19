import { Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout';
import { Dashboard } from './pages/Dashboard';
import { Jobs } from './pages/Jobs';
import { Estimates } from './pages/Estimates';
import { Alerts } from './pages/Alerts';
import { Vlad } from './pages/Vlad';
import { Settings } from './pages/Settings';
import NewProjectPage from './pages/NewProjectPage';
import ProjectPage from './pages/ProjectPage';
import UploadPage from './pages/UploadPage';
import PageViewer from './pages/PageViewer';

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/estimates" element={<Estimates />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/vlad" element={<Vlad />} />
        <Route path="/settings" element={<Settings />} />

        {/* Legacy blueprint routes */}
        <Route path="/projects/new" element={<NewProjectPage />} />
        <Route path="/projects/:projectId" element={<ProjectPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/uploads/:uploadId" element={<UploadPage />} />
        <Route path="/pages/:pageId" element={<PageViewer />} />
      </Route>
    </Routes>
  );
}
