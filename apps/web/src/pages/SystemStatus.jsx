import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Server,
  Database,
  Brain,
  FileImage,
  BarChart3,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Cpu,
  HardDrive,
  Activity
} from 'lucide-react';
import { api } from '../api/client';

export default function SystemStatus() {
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: statusData, isLoading, error, refetch } = useQuery({
    queryKey: ['systemStatus'],
    queryFn: () => api.get('/status'),
    refetchInterval: autoRefresh ? 30000 : false, // Refresh every 30 seconds
    retry: 2
  });

  useEffect(() => {
    document.title = 'System Status - PlansiteOS';
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getHealthScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading system status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Failed to Load Status
          </h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const status = statusData?.data;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">System Status</h1>
              <p className="text-gray-600 mt-1">
                Real-time monitoring of PlansiteOS infrastructure
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                Auto-refresh
              </label>
              <button
                onClick={() => refetch()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overall Status Card */}
        <div className={`rounded-xl border-2 p-6 mb-6 ${getStatusColor(status.overall.status)}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {getStatusIcon(status.overall.status)}
              <div>
                <h2 className="text-2xl font-bold capitalize">
                  System {status.overall.status}
                </h2>
                <p className="text-sm opacity-75">
                  Last updated: {new Date(status.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-4xl font-bold ${getHealthScoreColor(status.overall.healthScore)}`}>
                {status.overall.healthScore}%
              </div>
              <p className="text-sm opacity-75">Health Score</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Uptime: {status.overall.uptime}</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span>Version: {status.overall.version}</span>
            </div>
          </div>
        </div>

        {/* Service Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Server Status */}
          <ServiceCard
            title="Server"
            icon={<Server className="w-6 h-6" />}
            status={status.services.server.status}
            metrics={status.services.server.metrics}
            issues={status.services.server.issues}
            getStatusColor={getStatusColor}
            getStatusIcon={getStatusIcon}
          >
            {status.services.server.metrics && (
              <div className="space-y-3">
                <MetricRow
                  icon={<Cpu className="w-4 h-4" />}
                  label="CPU Usage"
                  value={`${status.services.server.metrics.cpu.usage}%`}
                />
                <MetricRow
                  icon={<HardDrive className="w-4 h-4" />}
                  label="Memory"
                  value={`${status.services.server.metrics.memory.usagePercent}%`}
                  detail={`${status.services.server.metrics.memory.used} / ${status.services.server.metrics.memory.total}`}
                />
                <MetricRow
                  icon={<Activity className="w-4 h-4" />}
                  label="Load Avg (1m)"
                  value={status.services.server.metrics.cpu.loadAverage['1min']}
                />
              </div>
            )}
          </ServiceCard>

          {/* Database Status */}
          <ServiceCard
            title="Database"
            icon={<Database className="w-6 h-6" />}
            status={status.services.database.status}
            metrics={status.services.database.metrics}
            issues={status.services.database.issues}
            getStatusColor={getStatusColor}
            getStatusIcon={getStatusIcon}
          >
            {status.services.database.metrics && (
              <div className="space-y-3">
                <MetricRow
                  label="Response Time"
                  value={status.services.database.metrics.responseTime}
                />
                <MetricRow
                  label="Database"
                  value={status.services.database.metrics.database}
                />
                <MetricRow
                  label="Size"
                  value={status.services.database.metrics.size}
                />
                <MetricRow
                  label="Tables"
                  value={status.services.database.metrics.tables}
                />
              </div>
            )}
          </ServiceCard>

          {/* AI Service Status */}
          <ServiceCard
            title="AI Service (Claude)"
            icon={<Brain className="w-6 h-6" />}
            status={status.services.aiService.status}
            metrics={status.services.aiService.metrics}
            issues={status.services.aiService.issues}
            getStatusColor={getStatusColor}
            getStatusIcon={getStatusIcon}
          >
            {status.services.aiService.metrics && (
              <div className="space-y-3">
                <MetricRow
                  label="Response Time"
                  value={status.services.aiService.metrics.responseTime}
                />
                <MetricRow
                  label="Vision Model"
                  value={status.services.aiService.metrics.models.vision}
                  small
                />
                <MetricRow
                  label="Processing Model"
                  value={status.services.aiService.metrics.models.processing}
                  small
                />
              </div>
            )}
          </ServiceCard>

          {/* Blueprint Engine Status */}
          <ServiceCard
            title="Blueprint Engine"
            icon={<FileImage className="w-6 h-6" />}
            status={status.services.blueprintEngine.status}
            metrics={status.services.blueprintEngine.metrics}
            issues={status.services.blueprintEngine.issues}
            getStatusColor={getStatusColor}
            getStatusIcon={getStatusIcon}
          >
            {status.services.blueprintEngine.metrics && (
              <div className="space-y-3">
                <MetricRow
                  label="Total Blueprints"
                  value={status.services.blueprintEngine.metrics.totalBlueprints}
                />
                <MetricRow
                  label="Processed"
                  value={status.services.blueprintEngine.metrics.processed}
                />
                <MetricRow
                  label="Success Rate"
                  value={status.services.blueprintEngine.metrics.successRate}
                />
                <MetricRow
                  label="Processing Queue"
                  value={status.services.blueprintEngine.metrics.processing}
                />
              </div>
            )}
          </ServiceCard>

          {/* Analytics Status */}
          <ServiceCard
            title="Analytics Engine"
            icon={<BarChart3 className="w-6 h-6" />}
            status={status.services.analytics.status}
            metrics={status.services.analytics.metrics}
            issues={status.services.analytics.issues}
            getStatusColor={getStatusColor}
            getStatusIcon={getStatusIcon}
          >
            {status.services.analytics.metrics && (
              <div className="space-y-3">
                <MetricRow
                  label="Total Projects"
                  value={status.services.analytics.metrics.projects.total}
                />
                <MetricRow
                  label="Active Projects"
                  value={status.services.analytics.metrics.projects.active}
                />
              </div>
            )}
          </ServiceCard>

          {/* Redis Status */}
          <ServiceCard
            title="Redis Cache"
            icon={<Database className="w-6 h-6" />}
            status={status.services.redis.status}
            metrics={status.services.redis.metrics}
            issues={status.services.redis.issues}
            getStatusColor={getStatusColor}
            getStatusIcon={getStatusIcon}
          >
            {status.services.redis.metrics && (
              <div className="space-y-3">
                <MetricRow
                  label="Response Time"
                  value={status.services.redis.metrics.responseTime}
                />
                {status.services.redis.note && (
                  <p className="text-xs text-gray-500 italic">
                    {status.services.redis.note}
                  </p>
                )}
              </div>
            )}
          </ServiceCard>
        </div>
      </div>
    </div>
  );
}

// Service Card Component
function ServiceCard({ title, icon, status, metrics, issues, getStatusColor, getStatusIcon, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
            {icon}
          </div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
        </div>
        {getStatusIcon(status)}
      </div>

      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-4 ${getStatusColor(status)}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </div>

      {children}

      {issues && issues.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm font-medium text-red-600 mb-2">Issues:</p>
          <ul className="space-y-1">
            {issues.map((issue, i) => (
              <li key={i} className="text-sm text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-3 h-3" />
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Metric Row Component
function MetricRow({ icon, label, value, detail, small }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-gray-600 flex items-center gap-2 ${small ? 'text-xs' : 'text-sm'}`}>
        {icon}
        {label}
      </span>
      <div className="text-right">
        <span className={`font-medium text-gray-900 ${small ? 'text-xs' : 'text-sm'}`}>
          {value}
        </span>
        {detail && (
          <p className="text-xs text-gray-500">{detail}</p>
        )}
      </div>
    </div>
  );
}
