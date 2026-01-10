const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

export async function createProject(payload: any) {
  const res = await fetch(`${API_BASE}/api/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create project');
  return res.json();
}

export async function uploadFile(projectId: string, file: File) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE}/api/projects/${projectId}/uploads`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) throw new Error('Failed to upload');
  return res.json();
}

export async function getUpload(uploadId: string) {
  const res = await fetch(`${API_BASE}/api/uploads/${uploadId}`);
  if (!res.ok) throw new Error('Upload not found');
  return res.json();
}

export async function getCalibration(pageId: string) {
  const res = await fetch(`${API_BASE}/api/pages/${pageId}/calibration`);
  if (!res.ok) throw new Error('Calibration fetch failed');
  return res.json();
}

export async function setCalibration(pageId: string, payload: any) {
  const res = await fetch(`${API_BASE}/api/pages/${pageId}/calibration`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Calibration save failed');
  return res.json();
}

export function pageImageUrl(pageId: string) {
  return `${API_BASE}/api/pages/${pageId}/image`;
}

export function pageThumbUrl(pageId: string) {
  return `${API_BASE}/api/pages/${pageId}/thumb`;
}
