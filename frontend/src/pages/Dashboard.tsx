import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge, { BadgeVariant } from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import {
  WrenchScrewdriverIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ChatBubbleLeftIcon,
  PlusIcon,
  CalculatorIcon,
  CloudArrowUpIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useBids, useBlueprints, useHealth, useBidStatistics } from '../hooks/useApi';
import { getShortcutDisplay } from '../hooks/useKeyboard';
import { DashboardSkeleton } from './DashboardSkeleton';

// Static color class mappings (Tailwind requires full class names at build time)
const STAT_BG_COLORS: Record<string, string> = {
  blue: 'bg-blue-500/10',
  yellow: 'bg-yellow-500/10',
  green: 'bg-green-500/10',
  purple: 'bg-purple-500/10',
  red: 'bg-red-500/10',
};

const STAT_TEXT_COLORS: Record<string, string> = {
  blue: 'text-blue-500',
  yellow: 'text-yellow-500',
  green: 'text-green-500',
  purple: 'text-purple-500',
  red: 'text-red-500',
};

// Type-safe badge variant mappings
const ACTIVITY_BADGE_VARIANTS: Record<string, BadgeVariant> = {
  green: 'green',
  red: 'red',
  yellow: 'yellow',
  blue: 'blue',
  purple: 'purple',
};

const DEADLINE_BADGE_VARIANTS: Record<string, BadgeVariant> = {
  urgent: 'red',
  upcoming: 'yellow',
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
  // API hooks
  const { data: bidsData, isLoading: loadingBids } = useBids(1, 50);
  const { data: blueprintsData, isLoading: loadingBlueprints } = useBlueprints(1, 50);
  const { data: healthData } = useHealth();
  const { data: statsData } = useBidStatistics();

  // Calculate stats from real data
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
      { label: 'Processing', value: String(processingBlueprints), icon: ArrowPathIcon, color: 'purple' }
    ];
  }, [bidsData, blueprintsData]);

  // Calculate revenue data from bids
  const revenueData = useMemo(() => {
    const bids = bidsData?.bids || [];
    const monthlyTotals: Record<string, number> = {};

    // Get last 6 months
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
      months.push(monthKey);
      monthlyTotals[monthKey] = 0;
    }

    // Sum accepted bids by month
    bids
      .filter(b => b.status === 'accepted')
      .forEach(bid => {
        const date = new Date(bid.created_at);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
        if (monthlyTotals[monthKey] !== undefined) {
          monthlyTotals[monthKey] += bid.grand_total;
        }
      });

    return months.map(month => ({
      month,
      revenue: monthlyTotals[month] || 0
    }));
  }, [bidsData]);

  // Recent activity from bids and blueprints
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

    // Add recent bids
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

    // Add recent blueprints
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

    // Sort by date and take top 4
    return activities
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 4);
  }, [bidsData, blueprintsData]);

  // Upcoming deadlines from pending bids
  const upcomingDeadlines = useMemo(() => {
    const pendingBids = (bidsData?.bids || [])
      .filter(b => b.status === 'sent' || b.status === 'pending_review')
      .slice(0, 3);

    return pendingBids.map(bid => ({
      id: bid.id,
      job: bid.project_name,
      date: new Date(bid.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      status: 'upcoming' as const,
    }));
  }, [bidsData]);

  const isLoading = loadingBids || loadingBlueprints;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
        <p className="text-slate-400 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Cards */}
      <section aria-label="Dashboard statistics">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">{stat.label}</p>
                    <p className="text-3xl font-bold text-slate-100 mt-2" aria-label={`${stat.label}: ${stat.value}`}>{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${STAT_BG_COLORS[stat.color]}`} aria-hidden="true">
                    <Icon className={`w-6 h-6 ${STAT_TEXT_COLORS[stat.color]}`} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 mt-4" role="img" aria-label={`Revenue chart showing ${revenueData.map(d => `${d.month}: $${d.revenue.toLocaleString()}`).join(', ')}`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData} aria-hidden="true">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={(value) => `$${value / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#e2e8f0' }}
                  itemStyle={{ color: '#3b82f6' }}
                  formatter={(value: number) => `$${value.toLocaleString()}`}
                />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {/* Screen reader accessible data summary */}
          <div className="sr-only">
            <h4>Revenue Data</h4>
            <ul>
              {revenueData.map((data) => (
                <li key={data.month}>{data.month}: ${data.revenue.toLocaleString()}</li>
              ))}
            </ul>
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
            {recentActivity.length > 0 ? (
              <ul className="space-y-4" aria-label="Recent activity list">
                {recentActivity.map((activity) => (
                  <li key={activity.id} className="flex items-start space-x-3">
                    <Badge variant={ACTIVITY_BADGE_VARIANTS[activity.badge] || 'slate'}>{activity.type}</Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200">{activity.title}</p>
                      <p className="text-xs text-slate-400 mt-1">{activity.description}</p>
                    </div>
                    <time className="text-xs text-slate-500" aria-label={`${activity.time}`}>{activity.time}</time>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={BellIcon}
                title="No recent activity"
                description="Your recent estimates and blueprints will appear here."
              />
            )}
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingDeadlines.length > 0 ? (
              <ul className="space-y-3" aria-label="Upcoming deadlines list">
                {upcomingDeadlines.map((deadline) => (
                  <li key={deadline.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                    <div>
                      <p className="text-sm font-medium text-slate-200">{deadline.job}</p>
                      <time className="text-xs text-slate-400 mt-1 block">{deadline.date}</time>
                    </div>
                    <Badge variant={DEADLINE_BADGE_VARIANTS[deadline.status]}>
                      {deadline.status === 'urgent' ? 'Urgent' : 'Soon'}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={ClockIcon}
                title="No upcoming deadlines"
                description="Pending estimates will appear here."
              />
            )}
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
            <ul className="flex flex-wrap gap-4" aria-label="System services status">
              <li className="flex items-center gap-2">
                {healthData.services.database.healthy ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-500" aria-hidden="true" />
                ) : (
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-500" aria-hidden="true" />
                )}
                <span className="text-sm text-slate-300">
                  Database
                  <span className="sr-only">: {healthData.services.database.healthy ? 'healthy' : 'unhealthy'}</span>
                </span>
              </li>
              <li className="flex items-center gap-2">
                {healthData.services.ai.initialized ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-500" aria-hidden="true" />
                ) : (
                  <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" aria-hidden="true" />
                )}
                <span className="text-sm text-slate-300">
                  AI Service
                  <span className="sr-only">: {healthData.services.ai.initialized ? 'initialized' : 'not initialized'}</span>
                </span>
              </li>
              <li className="flex items-center gap-2">
                {healthData.services.blueprints.initialized ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-500" aria-hidden="true" />
                ) : (
                  <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" aria-hidden="true" />
                )}
                <span className="text-sm text-slate-300">
                  Blueprint Processor
                  <span className="sr-only">: {healthData.services.blueprints.initialized ? 'initialized' : 'not initialized'}</span>
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Quick Actions</CardTitle>
            <p className="text-xs text-slate-500">
              Press <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-slate-800 border border-slate-700 rounded" aria-label="question mark">?</kbd> for shortcuts
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <nav aria-label="Quick actions">
            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <li>
                <Link to="/blueprints" className="block">
                  <Button variant="primary" className="w-full justify-between">
                    <span className="flex items-center">
                      <PlusIcon className="w-5 h-5 mr-2" aria-hidden="true" />
                      New Project
                    </span>
                    <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-xs font-semibold bg-slate-800/50 border border-slate-700 rounded" aria-label={`Keyboard shortcut: ${getShortcutDisplay('mod+u')}`}>
                      {getShortcutDisplay('mod+u')}
                    </kbd>
                  </Button>
                </Link>
              </li>
              <li>
                <Link to="/estimates" className="block">
                  <Button variant="secondary" className="w-full justify-between">
                    <span className="flex items-center">
                      <CalculatorIcon className="w-5 h-5 mr-2" aria-hidden="true" />
                      Quick Estimate
                    </span>
                    <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-xs font-semibold bg-slate-800/50 border border-slate-700 rounded" aria-label={`Keyboard shortcut: ${getShortcutDisplay('mod+n')}`}>
                      {getShortcutDisplay('mod+n')}
                    </kbd>
                  </Button>
                </Link>
              </li>
              <li>
                <Link to="/blueprints" className="block">
                  <Button variant="secondary" className="w-full justify-between">
                    <span className="flex items-center">
                      <CloudArrowUpIcon className="w-5 h-5 mr-2" aria-hidden="true" />
                      Upload Blueprint
                    </span>
                    <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-xs font-semibold bg-slate-800/50 border border-slate-700 rounded" aria-label={`Keyboard shortcut: ${getShortcutDisplay('mod+u')}`}>
                      {getShortcutDisplay('mod+u')}
                    </kbd>
                  </Button>
                </Link>
              </li>
            </ul>
          </nav>
        </CardContent>
      </Card>
    </div>
  );
}
