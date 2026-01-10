import { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { uploadFile } from '../components/api';

export default function ProjectPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = useCallback(
    async (file: File) => {
      if (!projectId) return;
      setUploading(true);
      setError('');
      try {
        const res = await uploadFile(projectId, file);
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
      <div
        className="upload-drop"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
      >
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
