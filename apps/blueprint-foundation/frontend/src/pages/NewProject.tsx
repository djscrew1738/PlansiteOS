/**
 * New Project creation page
 */
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../api/client'
import { FoundationType, ProjectCreate } from '../types'

export const NewProject: React.FC = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<ProjectCreate>({
    name: '',
    address: '',
    builder: '',
    foundation_type: FoundationType.UNKNOWN,
    floors: 1,
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const project = await apiClient.createProject(formData)
      navigate(`/projects/${project.id}`)
    } catch (error) {
      console.error('Failed to create project:', error)
      alert('Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}>
      <h1>Create New Project</h1>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label
            htmlFor="name"
            style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              fontSize: '14px',
            }}
          >
            Project Name *
          </label>
          <input
            id="name"
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              border: '2px solid #e0e0e0',
              borderRadius: '4px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label
            htmlFor="address"
            style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              fontSize: '14px',
            }}
          >
            Address
          </label>
          <input
            id="address"
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              border: '2px solid #e0e0e0',
              borderRadius: '4px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label
            htmlFor="builder"
            style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              fontSize: '14px',
            }}
          >
            Builder
          </label>
          <input
            id="builder"
            type="text"
            value={formData.builder}
            onChange={(e) => setFormData({ ...formData, builder: e.target.value })}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              border: '2px solid #e0e0e0',
              borderRadius: '4px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label
            htmlFor="foundation_type"
            style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              fontSize: '14px',
            }}
          >
            Foundation Type
          </label>
          <select
            id="foundation_type"
            value={formData.foundation_type}
            onChange={(e) =>
              setFormData({ ...formData, foundation_type: e.target.value as FoundationType })
            }
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              border: '2px solid #e0e0e0',
              borderRadius: '4px',
              boxSizing: 'border-box',
            }}
          >
            <option value={FoundationType.UNKNOWN}>Unknown</option>
            <option value={FoundationType.SLAB}>Slab</option>
            <option value={FoundationType.PIER_BEAM}>Pier & Beam</option>
          </select>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label
            htmlFor="floors"
            style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              fontSize: '14px',
            }}
          >
            Number of Floors
          </label>
          <input
            id="floors"
            type="number"
            min="1"
            max="10"
            value={formData.floors}
            onChange={(e) => setFormData({ ...formData, floors: parseInt(e.target.value) })}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              border: '2px solid #e0e0e0',
              borderRadius: '4px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '16px',
            fontSize: '16px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: loading ? '#ccc' : '#2196F3',
            color: 'white',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
          }}
        >
          {loading ? 'Creating...' : 'Create Project'}
        </button>
      </form>
    </div>
  )
}
