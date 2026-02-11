import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import {
  WrenchScrewdriverIcon,
  DocumentTextIcon,
  UserGroupIcon,
  PlusIcon,
  CalculatorIcon,
  CloudArrowUpIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useBids, useBlueprints, useHealth, useBidStatistics } from '../hooks/useApi';
import { getShortcutDisplay } from '../hooks/useKeyboard';
import { DashboardSkeleton } from './DashboardSkeleton';

// Stat card accent colors
const STAT_COLORS: Record<string, { bg: string; text: string; glow: string }> = {
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', glow: 'shadow-blue-500/20' },
  yellow: { bg: 'bg-amber-500/10', text: 'text-amber-400', glow: 'shadow-amber-500/20' },
  green: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', glow: 'shadow-emerald-500/20' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', glow: 'shadow-purple-500/20' },
};

// Format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function Dashboard() {
  const { data: bidsData, isLoading: loadingBids } = useBids(1, 50);
  const { data: blueprintsData, isLoading: loadingBlueprints } = useBlueprints(1, 50);
  const { data: healthData } = useHealth();
  const { data: statsData } = useBidStatistics();

  const stats = useMemo(() => {
    const bids = bidsData?.bids || [];
    const blueprints = blueprintsData?.blueprints || [];
    const draftBids = bids.filter(b => b.status === 'draft' || b.status === 'pending_review').length;
    const acceptedBids = bids.filter(b => b.status === 'accepted').length;
    const processingBlueprints = blueprints.filter(b => b.status === 'processing' || b.status === 'pending').length;

    return [
      { label: 'Active Bids', value: String(acceptedBids), icon: WrenchScrewdriverIcon, color: 'blue' },
      { label: 'Pending Estimates', value: String(draftBids), icon: CalculatorIcon, color: 'yellow' },
      { label: 'Blueprints', value: String(blueprints.length), icon: DocumentTextIcon, color: 'green' },
      { label: 'Processing', value: String(processingBlueprints), icon: ArrowPathIcon, color: 'purple' },
    ];
  }, [bidsData, blueprintsData]);

  const revenueData = useMemo(() => {
    const bids = bidsData?.bids || [];
    const monthlyTotals: Record<string, number> = {};
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
      months.push(monthKey);
      monthlyTotals[monthKey] = 0;
    }
    bids
      .filter(b => b.status === 'accepted')
      .forEach(bid => {
        const date = new Date(bid.created_at);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
        if (monthlyTotals[monthKey] !== undefined) monthlyTotals[monthKey] += bid.grand_total;
      });
    return months.map(month => ({ month, revenue: monthlyTotals[month] || 0 }));
  }, [bidsData]);

  const recentActivity = useMemo(() => {
    const activities: Array<{
      id: string;
      type: string;
      title: string;
      description: string;
      time: string;
      badge: string;
      date: Date;
    }> = [];

    (bidsData?.bids || []).slice(0, 5).forEach(bid => {
      const statusLabels: Record<string, string> = {
        draft: 'New estimate created',
        sent: 'Estimate sent',
        accepted: 'Estimate accepted',
        rejected: 'Estimate declined',
      };
      activities.push({
        id: `bid-${bid.id}`,
        type: 'estimate',
        title: statusLabels[bid.status] || 'Estimate updated',
        description: `${bid.project_name} - $${bid.grand_total.toLocaleString()}`,
        time: formatRelativeTime(bid.updated_at),
        badge: bid.status === 'accepted' ? 'green' : bid.status === 'rejected' ? 'red' : 'yellow',
        date: new Date(bid.updated_at),
      });
    });

    (blueprintsData?.blueprints || []).slice(0, 3).forEach(bp => {
      activities.push({
        id: `bp-${bp.id}`,
        type: 'blueprint',
        title: bp.status === 'completed' ? 'Blueprint analyzed' : 'Blueprint uploaded',
        description: `${bp.project_name} - ${bp.total_fixtures} fixtures`,
        time: formatRelativeTime(bp.updated_at),
        badge: bp.status === 'completed' ? 'blue' : bp.status === 'failed' ? 'red' : 'purple',
        date: new Date(bp.updated_at),
      });
    });

    return activities.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 4);
  }, [bidsData, blueprintsData]);

  const upcomingDeadlines = useMemo(() => {
    return (bidsData?.bids || [])
      .filter(b => b.status === 'sent' || b.status === 'pending_review')
      .slice(0, 3)
      .map(bid => ({
        id: bid.id,
        job: bid.project_name,
        date: new Date(bid.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        status: 'upcoming' as const,
      }));
  }, [bidsData]);

  if (loadingBids || loadingBlueprints) return <DashboardSkeleton />;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-50">Dashboard</h1>
        <p className="text-slate-400 mt-1.5 text-sm">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const c = STAT_COLORS[stat.color];
          return (
            <Card key={stat.label} className="relative overflow-hidden">
              {/* Subtle glow in corner */}
              <div className={`absolute -top-6 -right-6 h-20 w-20 rounded-full ${c.bg} blur-2xl opacity-60`} />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-slate-50">{stat.value}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${c.bg} shadow-lg ${c.glow}`}>
                  <Icon className={`h-5 w-5 ${c.text}`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(51, 65, 85, 0.4)" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(51, 65, 85, 0.6)',
                    borderRadius: '12px',
                    backdropFilter: 'blur(8px)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  }}
                  labelStyle={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 4 }}
                  itemStyle={{ color: '#60a5fa' }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fill="url(#revenueGradient)"
                  dot={{ fill: '#3b82f6', strokeWidth: 0, r: 4 }}
                  activeDot={{ fill: '#60a5fa', strokeWidth: 0, r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-6">No recent activity</p>
              )}
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 group">
                  <Badge variant={activity.badge as any} size="sm">{activity.type}</Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 group-hover:text-slate-100 transition-colors">
                      {activity.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{activity.description}</p>
                  </div>
                  <span className="text-[11px] text-slate-600 whitespace-nowrap">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingDeadlines.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-6">No pending deadlines</p>
              )}
              {upcomingDeadlines.map((deadline) => (
                <div
                  key={deadline.id}
                  className="flex items-center justify-between rounded-xl bg-slate-800/40 p-3.5 border border-slate-800/40 transition-colors hover:bg-slate-800/60"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-200">{deadline.job}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{deadline.date}</p>
                  </div>
                  <Badge variant={deadline.status === 'urgent' ? 'red' : 'yellow'} size="sm">
                    {deadline.status === 'urgent' ? 'Urgent' : 'Soon'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      {healthData && (
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-6">
              {[
                { label: 'Database', ok: healthData.services.database.healthy },
                { label: 'AI Service', ok: healthData.services.ai.initialized },
                { label: 'Blueprint Processor', ok: healthData.services.blueprints.initialized },
              ].map(({ label, ok }) => (
                <div key={label} className="flex items-center gap-2.5">
                  {ok ? (
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    </span>
                  ) : (
                    <ExclamationTriangleIcon className="h-4 w-4 text-amber-400" />
                  )}
                  <span className="text-sm text-slate-300">{label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Quick Actions</CardTitle>
            <p className="text-xs text-slate-600">
              Press{' '}
              <kbd className="mx-0.5 inline-flex h-5 items-center rounded border border-slate-700 bg-slate-800 px-1.5 font-mono text-[10px] font-semibold text-slate-400">
                ?
              </kbd>{' '}
              for shortcuts
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link to="/blueprints">
              <Button variant="primary" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <PlusIcon className="h-4 w-4" />
                  New Project
                </span>
                <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-white/15 bg-white/10 px-1.5 font-mono text-[10px] text-white/70">
                  {getShortcutDisplay('mod+u')}
                </kbd>
              </Button>
            </Link>
            <Link to="/estimates">
              <Button variant="secondary" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <CalculatorIcon className="h-4 w-4" />
                  Quick Estimate
                </span>
                <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-slate-600 bg-slate-700 px-1.5 font-mono text-[10px] text-slate-400">
                  {getShortcutDisplay('mod+n')}
                </kbd>
              </Button>
            </Link>
            <Link to="/blueprints">
              <Button variant="secondary" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <CloudArrowUpIcon className="h-4 w-4" />
                  Upload Blueprint
                </span>
                <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-slate-600 bg-slate-700 px-1.5 font-mono text-[10px] text-slate-400">
                  {getShortcutDisplay('mod+u')}
                </kbd>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
