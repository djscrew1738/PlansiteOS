import React, { useState, useEffect } from 'react';

interface ServiceStatus {
  status: string;
  name: string;
  description: string;
  lastCheck?: string;
  [key: string]: any;
}

interface SystemStatusData {
  overall: string;
  timestamp: string;
  services: {
    api: ServiceStatus;
    database: ServiceStatus;
    ai: ServiceStatus;
    blueprints: ServiceStatus;
  };
}

const SystemStatus: React.FC = () => {
  const [status, setStatus] = useState<SystemStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8090';
      const response = await fetch(`${apiBase}/api/status`);

      if (!response.ok) {
        throw new Error('Failed to fetch system status');
      }

      const data = await response.json();
      setStatus(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching system status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchStatus();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'healthy':
        return 'text-green-600';
      case 'warning':
      case 'degraded':
      case 'not_configured':
        return 'text-yellow-600';
      case 'unhealthy':
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'healthy':
        return '✓';
      case 'warning':
      case 'degraded':
      case 'not_configured':
        return '⚠';
      case 'unhealthy':
      case 'error':
        return '✗';
      default:
        return '?';
    }
  };

  const getStatusBadge = (status: string): string => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'warning':
      case 'degraded':
      case 'not_configured':
        return 'bg-yellow-100 text-yellow-800';
      case 'unhealthy':
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">System Status</h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading system status...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">System Status</h2>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Failed to load system status: {error}</p>
          <button
            onClick={fetchStatus}
            className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  const services = [
    {
      key: 'api',
      icon: '🖥️',
      ...status.services.api
    },
    {
      key: 'database',
      icon: '🗄️',
      ...status.services.database
    },
    {
      key: 'ai',
      icon: '🤖',
      ...status.services.ai
    },
    {
      key: 'blueprints',
      icon: '📐',
      ...status.services.blueprints
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">System Status</h2>
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(status.overall)}`}>
            {status.overall.charAt(0).toUpperCase() + status.overall.slice(1)}
          </span>
          <button
            onClick={fetchStatus}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            title="Refresh status"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((service) => (
          <div
            key={service.key}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{service.icon}</span>
                <div>
                  <h3 className="font-medium text-gray-900">{service.name}</h3>
                  <p className="text-sm text-gray-500">{service.description}</p>
                </div>
              </div>
              <span className={`text-2xl ${getStatusColor(service.status)}`}>
                {getStatusIcon(service.status)}
              </span>
            </div>

            {/* Additional service details */}
            <div className="mt-3 space-y-1">
              {service.key === 'api' && service.uptime && (
                <p className="text-xs text-gray-600">Uptime: {service.uptimeHuman}</p>
              )}
              {service.key === 'database' && service.connection && (
                <p className="text-xs text-gray-600">Connection: {service.connection}</p>
              )}
              {service.key === 'ai' && service.configured !== undefined && (
                <p className="text-xs text-gray-600">
                  {service.configured ? `Model: ${service.model || 'Claude'}` : 'Not configured'}
                </p>
              )}
              {service.key === 'blueprints' && service.statistics && (
                <div className="text-xs text-gray-600">
                  <p>Total: {service.statistics.total}</p>
                  <p>Completed: {service.statistics.completed}</p>
                  {service.statistics.pending > 0 && (
                    <p className="text-yellow-600">Pending: {service.statistics.pending}</p>
                  )}
                </div>
              )}
              {service.error && (
                <p className="text-xs text-red-600">Error: {service.error}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Last updated: {new Date(status.timestamp).toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default SystemStatus;
