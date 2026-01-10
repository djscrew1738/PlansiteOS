import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BarChart, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { BarChart3, TrendingUp, TrendingDown, Clock, CheckCircle2, XCircle, FileText, CalendarDays, Filter } from 'lucide-react';
import { api } from '../api/client';
import { format } from 'date-fns';

// Mock data for demonstration purposes
const mockBlueprintData = [
  { date: 'Jan 01', uploaded: 5, completed: 4, failed: 1 },
  { date: 'Jan 08', uploaded: 7, completed: 6, failed: 1 },
  { date: 'Jan 15', uploaded: 10, completed: 8, failed: 2 },
  { date: 'Jan 22', uploaded: 12, completed: 10, failed: 2 },
  { date: 'Jan 29', uploaded: 8, completed: 7, failed: 1 },
  { date: 'Feb 05', uploaded: 15, completed: 13, failed: 2 },
  { date: 'Feb 12', uploaded: 18, completed: 16, failed: 2 },
];

const mockStatusDistribution = [
  { name: 'Completed', value: 70, color: '#10B981' }, // emerald-500
  { name: 'Processing', value: 20, color: '#F59E0B' }, // amber-500
  { name: 'Failed', value: 10, color: '#EF4444' },     // red-500
];

const mockFixtureCounts = [
  { name: 'Lavatories', count: 120 },
  { name: 'Toilets', count: 90 },
  { name: 'Showers', count: 60 },
  { name: 'Sinks', count: 75 },
  { name: 'Hose Bibs', count: 30 },
];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};


export default function Analytics() {
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/api/v1/analytics/stats'),
  });

  const [dateRange, setDateRange] = useState('last30days'); // Placeholder for date range filtering

  const trendIcon = stats?.blueprints?.trend === 'up' ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : <TrendingDown className="w-4 h-4 text-red-500" />;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-10 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-3 rounded-full">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                Analytics Dashboard
              </h1>
              <p className="text-gray-500 mt-1">Dive into your data and track key performance indicators.</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="select-box pl-4 pr-10 py-2 rounded-lg shadow-sm border-gray-300 focus:ring-primary-500 focus:border-primary-500 text-sm"
          >
            <option value="today">Today</option>
            <option value="last7days">Last 7 Days</option>
            <option value="last30days">Last 30 Days</option>
            <option value="thismonth">This Month</option>
            <option value="lastmonth">Last Month</option>
            <option value="thisyear">This Year</option>
          </select>
          <button className="btn-outline flex-shrink-0">
            <Filter className="w-4 h-4 mr-2" />
            More Filters
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Blueprints"
          value={isLoadingStats ? '...' : stats?.blueprints?.total || '0'}
          change="+"
          trend={stats?.blueprints?.trend || 'up'}
          icon={FileText}
          color="blue"
        />
        <MetricCard
          title="Avg. Analysis Time"
          value={isLoadingStats ? '...' : `${stats?.analysis?.averageTime || '0'}s`}
          change="-"
          trend={stats?.analysis?.trend || 'down'}
          icon={Clock}
          color="amber"
        />
        <MetricCard
          title="Analysis Success"
          value={isLoadingStats ? '...' : `${stats?.analysis?.successRate || '0'}%`}
          change="+"
          trend="up"
          icon={CheckCircle2}
          color="emerald"
        />
        <MetricCard
          title="Total Fixtures Detected"
          value={isLoadingStats ? '...' : stats?.fixtures?.total || '0'}
          change="+"
          trend="up"
          icon={FileText}
          color="purple"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Blueprint Upload Trend */}
        <div className="lg:col-span-2 card p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Blueprint Activity Over Time</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={mockBlueprintData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.5} />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="uploaded" stackId="1" stroke="#3B82F6" fill="#BFDBFE" name="Uploaded" />
              <Area type="monotone" dataKey="completed" stackId="1" stroke="#10B981" fill="#A7F3D0" name="Completed" />
              <Area type="monotone" dataKey="failed" stackId="1" stroke="#EF4444" fill="#FECACA" name="Failed" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Blueprint Status Distribution */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Blueprint Status Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={mockStatusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {mockStatusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Fixture Analysis Breakdown */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Top Fixtures Detected</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {mockFixtureCounts.map((fixture, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-lg flex items-center justify-between shadow-sm border border-gray-100">
              <span className="text-gray-700 font-medium">{fixture.name}</span>
              <span className="text-lg font-bold text-primary-600">{fixture.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Raw Data Table - Conceptual */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Recent Blueprint Analysis (Table)</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fixtures</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoadingStats ? (
                <tr>
                  <td colSpan="4" className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">Loading recent data...</td>
                </tr>
              ) : (
                stats?.recentBlueprints?.length > 0 ? (
                  stats.recentBlueprints.map((bp) => (
                    <tr key={bp.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{bp.projectName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          bp.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                          bp.status === 'processing' ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {bp.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bp.totalFixtures}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{format(new Date(bp.createdAt), 'MMM d, yyyy')}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">No recent blueprint data available.</td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, change, trend, icon: Icon, color }) {
  const trendColor = trend === 'up' ? 'text-emerald-500' : 'text-red-500';
  const bgColor = {
    blue: 'bg-blue-50',
    amber: 'bg-amber-50',
    emerald: 'bg-emerald-50',
    purple: 'bg-purple-50',
  }[color];
  const iconColor = {
    blue: 'text-blue-600',
    amber: 'text-amber-600',
    emerald: 'text-emerald-600',
    purple: 'text-purple-600',
  }[color];

  return (
    <div className="card p-6 flex flex-col justify-between shadow-sm hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div className={`${bgColor} p-2 rounded-md`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        <div className="flex items-center mt-2">
          <span className={`flex items-center text-sm font-medium ${trendColor}`}>
            {trend === 'up' ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
            {change}%
          </span>
          <span className="ml-2 text-sm text-gray-500">vs last period</span>
        </div>
      </div>
    </div>
  );
}
