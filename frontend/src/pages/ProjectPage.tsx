import { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { uploadFile } from '../components/api';

export default function ProjectPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [revisionLabel, setRevisionLabel] = useState('');

  const handleFile = useCallback(
    async (file: File) => {
      if (!projectId) return;
      setUploading(true);
      setError('');
      try {
        const res = await uploadFile(projectId, file, revisionLabel || undefined);
        navigate(`/uploads/${res.uploadId}`);
      } catch (err) {
        setError('Upload failed');
      } finally {
        setUploading(false);
      }
    },
    [projectId, navigate]
  );

  return (
    <div className="card">
      <h2>Upload Blueprint</h2>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <button className="button" onClick={() => projectId && navigate(`/projects/${projectId}/pricing`)}>
          Pricing History
        </button>
        <button className="button" onClick={() => projectId && navigate(`/projects/${projectId}/quickbooks`)}>
          QuickBooks
        </button>
        <button className="button" onClick={() => projectId && navigate(`/workspaces/${projectId}/plumbing`)}>
          Plumbing Workspace
        </button>
      </div>
      <div
        className="upload-drop"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
      >
        <input
          className="input"
          placeholder="Revision label (Rev A, Rev B...)"
          value={revisionLabel}
          onChange={(e) => setRevisionLabel(e.target.value)}
        />
        <p>Drag and drop a PDF or image</p>
        <input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.heic"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>
      {uploading && <p>Uploading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
