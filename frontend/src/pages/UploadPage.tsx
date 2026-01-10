import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getUpload, pageThumbUrl, updatePage } from '../components/api';

interface Page {
  id: string;
  pageNumber: number;
  label?: string;
  isSelected?: boolean;
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

  const updateSelection = async (pageId: string, isSelected: boolean) => {
    await updatePage(pageId, { isSelected });
    setUpload((prev: any) => ({
      ...prev,
      pages: prev.pages.map((page: Page) => (page.id === pageId ? { ...page, isSelected } : page)),
    }));
  };

  const updateLabel = async (pageId: string, label: string) => {
    await updatePage(pageId, { label });
    setUpload((prev: any) => ({
      ...prev,
      pages: prev.pages.map((page: Page) => (page.id === pageId ? { ...page, label } : page)),
    }));
  };

  return (
    <div className="card">
      <h2>Upload Status</h2>
      <p>Status: {upload.status}</p>
      {upload.revisionLabel && <p>Revision: {upload.revisionLabel}</p>}
      {upload.progress && <p>Current: {upload.progress.current}</p>}
      {upload.status === 'READY' && (
        <div>
          <h3>Pages</h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {upload.pages.map((page: Page) => (
              <div key={page.id} style={{ width: '160px' }}>
                <button
                  onClick={() => {
                    localStorage.setItem('currentUploadId', upload.id);
                    navigate(`/pages/${page.id}`);
                  }}
                  style={{ border: 'none', background: 'transparent' }}
                >
                  <img className="thumb" src={pageThumbUrl(page.id)} />
                </button>
                <p>Page {page.pageNumber}</p>
                <label style={{ display: 'block', marginBottom: '6px' }}>
                  <input
                    type="checkbox"
                    checked={page.isSelected ?? true}
                    onChange={(e) => updateSelection(page.id, e.target.checked)}
                  />{' '}
                  Included
                </label>
                <select
                  className="input"
                  value={page.label || 'OTHER'}
                  onChange={(e) => updateLabel(page.id, e.target.value)}
                >
                  <option value="FLOOR_PLAN">Floor Plan</option>
                  <option value="PLUMBING">Plumbing</option>
                  <option value="ELEVATION">Elevation</option>
                  <option value="SITE">Site</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
