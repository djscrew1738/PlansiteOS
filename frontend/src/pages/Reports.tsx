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

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Reports & Analytics</h1>
        <p className="text-slate-400 mt-1">Business insights and performance metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total Revenue</p>
              <p className="text-2xl font-bold text-slate-100 mt-2">
                ${kpis.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <div className="flex items-center gap-1 mt-2">
                {kpis.revenueTrend >= 0 ? (
                  <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
                ) : (
                  <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-sm ${kpis.revenueTrend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {Math.abs(kpis.revenueTrend).toFixed(1)}%
                </span>
                <span className="text-xs text-slate-500">vs last month</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-green-500/10">
              <CurrencyDollarIcon className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Win Rate</p>
              <p className="text-2xl font-bold text-slate-100 mt-2">{kpis.conversionRate.toFixed(1)}%</p>
              <p className="text-xs text-slate-500 mt-2">
                {kpis.wonBids} of {kpis.totalBids} bids won
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10">
              <CheckCircleIcon className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Avg Bid Value</p>
              <p className="text-2xl font-bold text-slate-100 mt-2">
                ${kpis.avgBidValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-slate-500 mt-2">Across all estimates</p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-500/10">
              <ChartBarIcon className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Avg Time to Close</p>
              <p className="text-2xl font-bold text-slate-100 mt-2">{avgTimeToClose} days</p>
              <p className="text-xs text-slate-500 mt-2">Draft to accepted</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/10">
              <ClockIcon className="w-6 h-6 text-purple-500" />
            </div>
          </div>
        </Card>
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    labelStyle={{ color: '#e2e8f0' }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Line type="monotone" dataKey="revenue" stroke={COLORS.primary} strokeWidth={2} dot={{ fill: COLORS.primary }} />
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
