import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProject } from '../components/api';

export default function NewProjectPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    address: '',
    builder: '',
    foundationType: 'UNKNOWN',
    floors: 1,
  });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      const project = await createProject(form);
      navigate(`/projects/${project.id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Create Project</h2>
      <input
        className="input"
        placeholder="Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <input
        className="input"
        placeholder="Address"
        value={form.address}
        onChange={(e) => setForm({ ...form, address: e.target.value })}
      />
      <input
        className="input"
        placeholder="Builder"
        value={form.builder}
        onChange={(e) => setForm({ ...form, builder: e.target.value })}
      />
      <select
        className="input"
        value={form.foundationType}
        onChange={(e) => setForm({ ...form, foundationType: e.target.value })}
      >
        <option value="UNKNOWN">Unknown</option>
        <option value="SLAB">Slab</option>
        <option value="PIER_BEAM">Pier & Beam</option>
      </select>
      <input
        className="input"
        type="number"
        min={1}
        value={form.floors}
        onChange={(e) => setForm({ ...form, floors: Number(e.target.value) })}
      />
      <button className="button" onClick={submit} disabled={loading}>
        {loading ? 'Creating...' : 'Create Project'}
      </button>
    </div>
  );
}
