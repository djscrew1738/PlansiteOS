import { useMemo } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  CurrencyDollarIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import { useBids, useBlueprints } from '../hooks/useApi';
import { ReportsSkeleton } from './ReportsSkeleton';

// Chart colors
const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  indigo: '#6366f1',
};

const PIE_COLORS = [COLORS.primary, COLORS.success, COLORS.warning, COLORS.danger, COLORS.purple];

export default function Reports() {
  const { data: bidsData, isLoading: loadingBids } = useBids(1, 100);
  const { data: blueprintsData, isLoading: loadingBlueprints } = useBlueprints(1, 100);

  const isLoading = loadingBids || loadingBlueprints;

  // Calculate KPIs
  const kpis = useMemo(() => {
    const bids = bidsData?.bids || [];
    const totalBids = bids.length;
    const wonBids = bids.filter(b => b.status === 'accepted').length;
    const totalRevenue = bids
      .filter(b => b.status === 'accepted')
      .reduce((sum, bid) => sum + bid.grand_total, 0);
    const avgBidValue = totalBids > 0
      ? bids.reduce((sum, bid) => sum + bid.grand_total, 0) / totalBids
      : 0;
    const conversionRate = totalBids > 0 ? (wonBids / totalBids) * 100 : 0;

    // Calculate trend (last 30 days vs previous 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const recentRevenue = bids
      .filter(b => b.status === 'accepted' && new Date(b.created_at) >= thirtyDaysAgo)
      .reduce((sum, bid) => sum + bid.grand_total, 0);

    const previousRevenue = bids
      .filter(b =>
        b.status === 'accepted' &&
        new Date(b.created_at) >= sixtyDaysAgo &&
        new Date(b.created_at) < thirtyDaysAgo
      )
      .reduce((sum, bid) => sum + bid.grand_total, 0);

    const revenueTrend = previousRevenue > 0
      ? ((recentRevenue - previousRevenue) / previousRevenue) * 100
      : 0;

    return {
      totalRevenue,
      totalBids,
      wonBids,
      avgBidValue,
      conversionRate,
      revenueTrend,
    };
  }, [bidsData]);

  // Revenue by month (last 6 months)
  const revenueByMonth = useMemo(() => {
    const bids = bidsData?.bids || [];
    const months: { month: string; revenue: number; bids: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

      const monthBids = bids.filter(b => {
        const bidDate = new Date(b.created_at);
        return (
          bidDate.getMonth() === date.getMonth() &&
          bidDate.getFullYear() === date.getFullYear()
        );
      });

      const monthRevenue = monthBids
        .filter(b => b.status === 'accepted')
        .reduce((sum, bid) => sum + bid.grand_total, 0);

      months.push({
        month: monthKey,
        revenue: monthRevenue,
        bids: monthBids.length,
      });
    }

    return months;
  }, [bidsData]);

  // Bids by status
  const bidsByStatus = useMemo(() => {
    const bids = bidsData?.bids || [];
    const statusCount: Record<string, number> = {};

    bids.forEach(bid => {
      statusCount[bid.status] = (statusCount[bid.status] || 0) + 1;
    });

    return Object.entries(statusCount).map(([status, count]) => ({
      name: status.replace('_', ' '),
      value: count,
    }));
  }, [bidsData]);

  // Top customers by revenue
  const topCustomers = useMemo(() => {
    const bids = bidsData?.bids || [];
    const customerRevenue: Record<string, number> = {};

    bids
      .filter(b => b.status === 'accepted' && b.customer_name)
      .forEach(bid => {
        const customer = bid.customer_name!;
        customerRevenue[customer] = (customerRevenue[customer] || 0) + bid.grand_total;
      });

    return Object.entries(customerRevenue)
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [bidsData]);

  // Fixture analysis
  const fixtureAnalysis = useMemo(() => {
    const blueprints = blueprintsData?.blueprints || [];
    const fixtureTotals: Record<string, number> = {};

    blueprints
      .filter(bp => bp.analysis_data?.fixtureTotals)
      .forEach(bp => {
        Object.entries(bp.analysis_data!.fixtureTotals).forEach(([type, count]) => {
          fixtureTotals[type] = (fixtureTotals[type] || 0) + count;
        });
      });

    return Object.entries(fixtureTotals)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [blueprintsData]);

  // Average time to close (draft to accepted)
  const avgTimeToClose = useMemo(() => {
    const bids = bidsData?.bids || [];
    const closedBids = bids.filter(b => b.status === 'accepted');

    if (closedBids.length === 0) return 0;

    const totalDays = closedBids.reduce((sum, bid) => {
      const created = new Date(bid.created_at);
      const updated = new Date(bid.updated_at);
      const days = Math.floor((updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);

    return Math.round(totalDays / closedBids.length);
  }, [bidsData]);

  if (isLoading) {
    return <ReportsSkeleton />;
  }

  const KPI_CARDS = [
    {
      label: 'Total Revenue', color: 'emerald', Icon: CurrencyDollarIcon,
      value: `$${kpis.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: <div className="flex items-center gap-1 mt-2">
        {kpis.revenueTrend >= 0 ? <ArrowTrendingUpIcon className="w-3.5 h-3.5 text-emerald-400" /> : <ArrowTrendingDownIcon className="w-3.5 h-3.5 text-red-400" />}
        <span className={`text-xs font-semibold ${kpis.revenueTrend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{Math.abs(kpis.revenueTrend).toFixed(1)}%</span>
        <span className="text-[11px] text-slate-600">vs last month</span>
      </div>,
    },
    { label: 'Win Rate', color: 'blue', Icon: CheckCircleIcon, value: `${kpis.conversionRate.toFixed(1)}%`, sub: <p className="text-[11px] text-slate-600 mt-2">{kpis.wonBids} of {kpis.totalBids} bids won</p> },
    { label: 'Avg Bid Value', color: 'amber', Icon: ChartBarIcon, value: `$${kpis.avgBidValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, sub: <p className="text-[11px] text-slate-600 mt-2">Across all estimates</p> },
    { label: 'Avg Time to Close', color: 'purple', Icon: ClockIcon, value: `${avgTimeToClose} days`, sub: <p className="text-[11px] text-slate-600 mt-2">Draft to accepted</p> },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-50">Reports & Analytics</h1>
        <p className="text-sm text-slate-400 mt-1.5">Business insights and performance metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {KPI_CARDS.map(({ label, color, Icon, value, sub }) => (
          <Card key={label} className="relative overflow-hidden">
            <div className={`absolute -top-6 -right-6 h-20 w-20 rounded-full bg-${color}-500/10 blur-2xl opacity-60`} />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-slate-50">{value}</p>
                {sub}
              </div>
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-${color}-500/10 shadow-lg shadow-${color}-500/20`}>
                <Icon className={`h-5 w-5 text-${color}-400`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.4)" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(15,23,42,0.95)', border: '1px solid rgba(51,65,85,0.6)', borderRadius: '12px', backdropFilter: 'blur(8px)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
                    labelStyle={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 4 }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Line type="monotone" dataKey="revenue" stroke={COLORS.primary} strokeWidth={2.5} dot={{ fill: COLORS.primary, strokeWidth: 0, r: 4 }} activeDot={{ fill: '#60a5fa', strokeWidth: 0, r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Bids by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Bids by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bidsByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {bidsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Customers */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Customers by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {topCustomers.length > 0 ? (
              <div className="space-y-3">
                {topCustomers.map((customer, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-400">#{index + 1}</span>
                      </div>
                      <span className="text-slate-200">{customer.name}</span>
                    </div>
                    <span className="text-lg font-semibold text-green-500">
                      ${customer.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-400 py-8">No customer data available</p>
            )}
          </CardContent>
        </Card>

        {/* Fixture Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Most Common Fixtures</CardTitle>
          </CardHeader>
          <CardContent>
            {fixtureAnalysis.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={fixtureAnalysis} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" stroke="#94a3b8" />
                    <YAxis dataKey="type" type="category" stroke="#94a3b8" width={100} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                      labelStyle={{ color: '#e2e8f0' }}
                      formatter={(value: number) => [value, 'Count']}
                    />
                    <Bar dataKey="count" fill={COLORS.success} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-slate-400 py-8">No fixture data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Total Bids</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Avg Bid Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {revenueByMonth.map((month, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{month.month}</TableCell>
                  <TableCell>{month.bids}</TableCell>
                  <TableCell className="text-green-500">
                    ${month.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    ${month.bids > 0
                      ? (month.revenue / month.bids).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                      : '0'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
