import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getQuickBooksConfig, setQuickBooksConfig } from '../components/api';

export default function QuickBooksPage() {
  const { projectId } = useParams();
  const [config, setConfig] = useState<any>(null);
  const [form, setForm] = useState({ companyId: '', status: 'DISCONNECTED' });

  useEffect(() => {
    if (!projectId) return;
    getQuickBooksConfig(projectId).then((data) => {
      setConfig(data);
      if (data) {
        setForm({ companyId: data.companyId, status: data.status });
      }
    });
  }, [projectId]);

  const save = async () => {
    if (!projectId) return;
    const payload = {
      projectId,
      companyId: form.companyId,
      status: form.status,
    };
    const saved = await setQuickBooksConfig(payload);
    setConfig(saved);
  };

  return (
    <div className="card">
      <h2>QuickBooks Integration</h2>
      <p>Status: {config?.status || 'Not configured'}</p>
      <input
        className="input"
        placeholder="Company ID"
        value={form.companyId}
        onChange={(e) => setForm((prev) => ({ ...prev, companyId: e.target.value }))}
      />
      <select
        className="input"
        value={form.status}
        onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
      >
        <option value="DISCONNECTED">Disconnected</option>
        <option value="CONNECTED">Connected</option>
        <option value="ERROR">Error</option>
      </select>
      <button className="button" onClick={save}>Save Config</button>
      <p>OAuth flow integration pending. Store tokens via backend once enabled.</p>
    </div>
  );
}
