import { useQuery } from '@tanstack/react-query';
import { FileText, Users, DollarSign, TrendingUp, Activity, Sparkles } from 'lucide-react';
import { api } from '../api/client';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/api/v1/analytics/stats'),
  });

  const statCards = [
    {
      name: 'Total Blueprints',
      value: stats?.blueprints?.total || '0',
      change: '+12%',
      trend: 'up',
      icon: FileText,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      name: 'Active Leads',
      value: stats?.leads?.active || '0',
      change: '+8%',
      trend: 'up',
      icon: Users,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      name: 'Bids Generated',
      value: stats?.bids?.total || '0',
      change: '+23%',
      trend: 'up',
      icon: DollarSign,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      name: 'Win Rate',
      value: stats?.bids?.winRate || '0%',
      change: '+5%',
      trend: 'up',
      icon: TrendingUp,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <Sparkles className="w-6 h-6 text-primary-500 animate-pulse" />
          </div>
          <p className="text-gray-600 mt-2">Welcome back to PipelineOS - Your AI-powered plumbing assistant</p>
        </div>
        <Link to="/blueprints" className="btn-primary">
          <FileText className="w-4 h-4 mr-2" />
          Upload Blueprint
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div
            key={stat.name}
            className="stat-card group hover:scale-105 transition-transform duration-300"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.bgColor} p-3 rounded-xl group-hover:scale-110 transition-transform`}>
                  <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
                <span className={`text-xs font-semibold ${
                  stat.trend === 'up' ? 'text-emerald-600' : 'text-red-600'
                } flex items-center space-x-1`}>
                  <TrendingUp className={`w-3 h-3 ${stat.trend === 'down' && 'rotate-180'}`} />
                  <span>{stat.change}</span>
                </span>
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">{stat.name}</p>
              <p className="text-3xl font-bold text-gray-900">
                {isLoading ? (
                  <span className="skeleton h-9 w-20 inline-block"></span>
                ) : (
                  stat.value
                )}
              </p>
              <p className="text-xs text-gray-500 mt-2">from last month</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Blueprints - Takes 2 columns */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Blueprints</h2>
            <Link to="/blueprints" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View all →
            </Link>
          </div>
          <RecentBlueprintsList />
        </div>

        {/* System Status - Takes 1 column */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">System Status</h2>
          <SystemStatus />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card bg-gradient-to-br from-primary-50 to-blue-50 border-primary-100">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/blueprints" className="btn-secondary justify-start p-4 hover:bg-white">
            <FileText className="w-5 h-5 mr-3" />
            <div className="text-left">
              <p className="font-semibold">Upload Blueprint</p>
              <p className="text-xs text-gray-500">Analyze with AI</p>
            </div>
          </Link>
          <Link to="/leads" className="btn-secondary justify-start p-4 hover:bg-white">
            <Users className="w-5 h-5 mr-3" />
            <div className="text-left">
              <p className="font-semibold">Manage Leads</p>
              <p className="text-xs text-gray-500">Track inquiries</p>
            </div>
          </Link>
          <Link to="/bids" className="btn-secondary justify-start p-4 hover:bg-white">
            <DollarSign className="w-5 h-5 mr-3" />
            <div className="text-left">
              <p className="font-semibold">Generate Bid</p>
              <p className="text-xs text-gray-500">Create proposal</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

function RecentBlueprintsList() {
  const { data: blueprints, isLoading } = useQuery({
    queryKey: ['blueprints', { limit: 5 }],
    queryFn: () => api.get('/api/blueprints?limit=5'),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center space-x-4 py-4 border-b last:border-0">
            <div className="skeleton h-12 w-12 rounded-xl"></div>
            <div className="flex-1 space-y-2">
              <div className="skeleton h-5 w-3/4"></div>
              <div className="skeleton h-4 w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!blueprints?.data || blueprints.data.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-600 mb-4">No blueprints yet</p>
        <Link to="/blueprints" className="btn-primary btn-sm">
          Upload your first blueprint
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {blueprints.data.map(blueprint => (
        <Link
          key={blueprint.id}
          to={`/blueprints/${blueprint.id}`}
          className="flex items-center justify-between py-4 px-4 rounded-xl hover:bg-gray-50 transition-colors group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                {blueprint.project_name}
              </p>
              <p className="text-sm text-gray-500">
                {blueprint.total_fixtures} fixtures detected
              </p>
            </div>
          </div>
          <span
            className={`px-3 py-1 text-xs rounded-full font-medium ${
              blueprint.status === 'completed'
                ? 'badge-success'
                : blueprint.status === 'processing'
                ? 'badge-warning'
                : 'badge-neutral'
            }`}
          >
            {blueprint.status}
          </span>
        </Link>
      ))}
    </div>
  );
}

function SystemStatus() {
  const { data: health, isLoading } = useQuery({
    queryKey: ['health'],
    queryFn: () => api.get('/api/health'),
    refetchInterval: 30000,
  });

  const services = [
    {
      name: 'API Server',
      status: health?.status === 'healthy' ? 'operational' : 'degraded',
      description: 'Core API service',
    },
    {
      name: 'Database',
      status: health?.services?.database?.healthy ? 'operational' : 'down',
      description: 'PostgreSQL',
    },
    {
      name: 'AI Service',
      status: health?.services?.ai?.initialized ? 'operational' : 'down',
      description: 'Claude Vision',
    },
    {
      name: 'Blueprints',
      status: health?.services?.blueprints?.initialized ? 'operational' : 'down',
      description: 'Analysis engine',
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center justify-between py-3">
            <div className="flex items-center space-x-3">
              <div className="skeleton h-3 w-3 rounded-full"></div>
              <div className="skeleton h-4 w-24"></div>
            </div>
            <div className="skeleton h-6 w-20 rounded-full"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {services.map(service => (
        <div
          key={service.name}
          className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Activity
                className={`w-4 h-4 ${
                  service.status === 'operational' ? 'text-emerald-500' : 'text-red-500'
                }`}
              />
              {service.status === 'operational' && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{service.name}</p>
              <p className="text-xs text-gray-500">{service.description}</p>
            </div>
          </div>
          <span
            className={`px-2.5 py-1 text-xs rounded-full font-medium ${
              service.status === 'operational' ? 'badge-success' : 'badge-error'
            }`}
          >
            {service.status}
          </span>
        </div>
      ))}
    </div>
  );
}
