import { useQuery } from '@tanstack/react-query';
import { FileText, Users, DollarSign, TrendingUp, Activity, Sparkles, PlusCircle } from 'lucide-react';
import { api } from '../api/client';
import { Link } from 'react-router-dom';

// A more visually engaging and responsive chart for stats
const StatChart = ({ trend, color }) => (
  <div className="w-16 h-8">
    <svg viewBox="0 0 100 40" className="w-full h-full">
      <path
        d={trend === 'up' ? "M 0 35 Q 25 10, 50 20 T 100 5" : "M 0 5 Q 25 30, 50 20 T 100 35"}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  </div>
);

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
      color: '#3B82F6', // blue-500
    },
    {
      name: 'Active Leads',
      value: stats?.leads?.active || '0',
      change: '+8%',
      trend: 'up',
      icon: Users,
      color: '#10B981', // emerald-500
    },
    {
      name: 'Bids Generated',
      value: stats?.bids?.total || '0',
      change: '+23%',
      trend: 'up',
      icon: DollarSign,
      color: '#8B5CF6', // purple-500
    },
    {
      name: 'Win Rate',
      value: stats?.bids?.winRate || '0%',
      change: '-2%',
      trend: 'down',
      icon: TrendingUp,
      color: '#F97316', // orange-500
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-10 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-start gap-4">
            <div className="bg-gradient-to-br from-primary-100 to-primary-50 p-4 rounded-2xl flex-shrink-0">
              <Sparkles className="w-8 h-8 text-primary-600" />
            </div>
            <div>
              <h1 className="text-5xl font-black text-gray-900 tracking-tight mb-2">
                Command Center
              </h1>
              <p className="text-lg text-gray-600 mb-1">Your PlansiteOS central hub</p>
              <p className="text-sm text-gray-500">Monitor projects, analyze blueprints, and drive your plumbing business forward</p>
            </div>
          </div>
        </div>
        <Link to="/blueprints" className="btn-primary btn-lg shadow-lg hover:shadow-xl transition-shadow flex-shrink-0">
          <PlusCircle className="w-5 h-5 mr-2" />
          Upload Blueprint
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div
            key={stat.name}
            className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 group"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="text-4xl font-bold text-gray-800 mt-2">
                  {isLoading ? <span className="skeleton h-10 w-24 inline-block"></span> : stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-full bg-gray-50`}>
                <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
              </div>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div className="flex items-center gap-2 text-sm">
                <span className={`flex items-center font-semibold ${stat.trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
                  <TrendingUp className={`w-4 h-4 mr-1 ${stat.trend === 'down' && 'rotate-180'}`} />
                  {stat.change}
                </span>
                <span className="text-gray-400">vs last month</span>
              </div>
              <StatChart trend={stat.trend} color={stat.color} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Recent Blueprints - Takes 3 columns */}
        <div className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Recent Activity</h2>
            <Link to="/blueprints" className="btn-secondary btn-sm">
              View All
            </Link>
          </div>
          <RecentBlueprintsList />
        </div>

        {/* System Status & Quick Actions - Takes 2 columns */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">System Status</h2>
            <SystemStatus />
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Quick Actions</h2>
            <div className="flex flex-col gap-3">
              <Link to="/blueprints" className="btn-outline w-full justify-start p-4 text-left">
                <FileText className="w-5 h-5 mr-3 text-primary-500" />
                <div>
                  <p className="font-semibold">Analyze New Blueprint</p>
                  <p className="text-xs text-gray-500">Extract fixtures and measurements with AI</p>
                </div>
              </Link>
              <Link to="/leads" className="btn-outline w-full justify-start p-4 text-left">
                <Users className="w-5 h-5 mr-3 text-emerald-500" />
                <div>
                  <p className="font-semibold">Manage Customer Leads</p>
                  <p className="text-xs text-gray-500">View and update active inquiries</p>
                </div>
              </Link>
            </div>
          </div>
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
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-2">
            <div className="skeleton h-12 w-12 rounded-lg"></div>
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-3/4"></div>
              <div className="skeleton h-3 w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!blueprints?.data || blueprints.data.length === 0) {
    return (
      <div className="text-center py-16 bg-gradient-to-br from-primary-50 to-blue-50 border-2 border-primary-100 rounded-2xl">
        <div className="w-24 h-24 bg-primary-100 rounded-full mx-auto mb-6 flex items-center justify-center">
          <FileText className="w-12 h-12 text-primary-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Ready to get started?</h3>
        <p className="text-lg text-gray-600 mb-2">Upload your first blueprint to unlock AI-powered analysis</p>
        <p className="text-sm text-gray-500 mb-8">PlansiteOS will extract fixtures, measure components, and help you generate accurate bids</p>
        <Link to="/blueprints" className="btn-primary btn-lg">
          <PlusCircle className="w-5 h-5 mr-2" />
          Upload Your First Blueprint
        </Link>
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-my-4 divide-y divide-gray-100">
        {blueprints.data.map(blueprint => (
          <li key={blueprint.id}>
            <Link
              to={`/blueprints/${blueprint.id}`}
              className="flex items-center space-x-4 py-4 px-2 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="flex-shrink-0 w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-md font-semibold text-gray-800 truncate group-hover:text-primary-600">
                  {blueprint.project_name}
                </p>
                <p className="text-sm text-gray-500">
                  {blueprint.total_fixtures || 0} fixtures
                </p>
              </div>
              <div
                className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${
                  blueprint.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                  blueprint.status === 'processing' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                  'bg-gray-100 text-gray-800'
                }`}
              >
                {blueprint.status}
              </div>
            </Link>
          </li>
        ))}
      </ul>
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
    { name: 'API Server', status: health?.status === 'healthy', desc: 'Core service' },
    { name: 'Database', status: health?.services?.database?.healthy, desc: 'PostgreSQL' },
    { name: 'AI Service', status: health?.services?.ai?.initialized, desc: 'Claude Vision' },
    { name: 'Blueprints', status: health?.services?.blueprints?.initialized, desc: 'Analysis engine' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-2">
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
    <div className="space-y-4">
      {services.map(service => (
        <div key={service.name} className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className={`h-2.5 w-2.5 rounded-full ${service.status ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
            <div>
              <p className="text-sm font-medium text-gray-800">{service.name}</p>
              <p className="text-xs text-gray-500">{service.desc}</p>
            </div>
          </div>
          <p className={`text-sm font-semibold ${service.status ? 'text-emerald-600' : 'text-red-600'}`}>
            {service.status ? 'Operational' : 'Down'}
          </p>
        </div>
      ))}
    </div>
  );
}
