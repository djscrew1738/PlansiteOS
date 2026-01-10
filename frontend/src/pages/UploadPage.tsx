import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getUpload, pageThumbUrl } from '../components/api';

interface Page {
  id: string;
  pageNumber: number;
}

export default function UploadPage() {
  const { uploadId } = useParams();
  const [upload, setUpload] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!uploadId) return;
    const interval = setInterval(async () => {
      const data = await getUpload(uploadId);
      setUpload(data);
    }, 2000);
    return () => clearInterval(interval);
  }, [uploadId]);

  if (!upload) {
    return <p>Loading...</p>;
  }

  return (
    <div className="card">
      <h2>Upload Status</h2>
      <p>Status: {upload.status}</p>
      {upload.progress && <p>Current: {upload.progress.current}</p>}
      {upload.status === 'READY' && (
        <div>
          <h3>Pages</h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {upload.pages.map((page: Page) => (
              <button
                key={page.id}
                onClick={() => {
                  localStorage.setItem('currentUploadId', upload.id);
                  navigate(`/pages/${page.id}`);
                }}
                style={{ border: 'none', background: 'transparent' }}
              >
                <img className="thumb" src={pageThumbUrl(page.id)} />
                <p>Page {page.pageNumber}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
