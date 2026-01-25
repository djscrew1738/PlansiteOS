/**
 * Main App component with routing
 */
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { NewProject } from './pages/NewProject'
import { ProjectDetail } from './pages/ProjectDetail'
import { UploadDetail } from './pages/UploadDetail'
import { PageViewer } from './pages/PageViewer'
import { Dashboard } from './pages/Dashboard'
import { UploadSummaryView } from './pages/UploadSummaryView'

function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        {/* Simple navigation header */}
        <header
          style={{
            backgroundColor: '#2196F3',
            color: 'white',
            padding: '16px 24px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '24px' }}>
            <Link
              to="/"
              style={{
                color: 'white',
                textDecoration: 'none',
                fontSize: '20px',
                fontWeight: 'bold',
              }}
            >
              📐 Blueprint Upload
            </Link>
            <Link
              to="/dashboard"
              style={{
                color: 'white',
                textDecoration: 'none',
                fontSize: '14px',
                padding: '8px 16px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: '4px',
              }}
            >
              Dashboard
            </Link>
            <Link
              to="/projects/new"
              style={{
                color: 'white',
                textDecoration: 'none',
                fontSize: '14px',
                padding: '8px 16px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: '4px',
              }}
            >
              + New Project
            </Link>
          </div>
        </header>

        {/* Routes */}
        <Routes>
          <Route
            path="/"
            element={
              <div style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 24px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '48px', marginBottom: '16px' }}>📐</h1>
                <h2 style={{ marginBottom: '16px' }}>Blueprint Upload Foundation</h2>
                <p style={{ color: '#666', marginBottom: '32px' }}>
                  Upload, process, and calibrate construction blueprints
                </p>
                <Link
                  to="/projects/new"
                  style={{
                    display: 'inline-block',
                    padding: '16px 32px',
                    fontSize: '16px',
                    backgroundColor: '#2196F3',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                  }}
                >
                  Create New Project
                </Link>
              </div>
            }
          />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects/new" element={<NewProject />} />
          <Route path="/projects/:projectId" element={<ProjectDetail />} />
          <Route path="/uploads/:uploadId" element={<UploadDetail />} />
          <Route path="/uploads/:uploadId/summary" element={<UploadSummaryView />} />
          <Route path="/pages/:pageId" element={<PageViewer />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
