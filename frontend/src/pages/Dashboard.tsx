import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import {
  WrenchScrewdriverIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ChatBubbleLeftIcon,
  PlusIcon,
  CalculatorIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Mock data
const stats = [
  { label: 'Active Jobs', value: '12', icon: WrenchScrewdriverIcon, color: 'blue' },
  { label: 'Pending Estimates', value: '8', icon: CalculatorIcon, color: 'yellow' },
  { label: 'New Leads (Week)', value: '5', icon: UserGroupIcon, color: 'green' },
  { label: 'Unread Messages', value: '3', icon: ChatBubbleLeftIcon, color: 'purple' }
];

const revenueData = [
  { month: 'Jul', revenue: 45000 },
  { month: 'Aug', revenue: 52000 },
  { month: 'Sep', revenue: 48000 },
  { month: 'Oct', revenue: 61000 },
  { month: 'Nov', revenue: 58000 },
  { month: 'Dec', revenue: 67000 }
];

const recentActivity = [
  { id: 1, type: 'job', title: 'New job created', description: 'Westlake Apartments - Building C', time: '2h ago', badge: 'blue' },
  { id: 2, type: 'estimate', title: 'Estimate sent', description: 'Highland Park Townhomes - $24,500', time: '5h ago', badge: 'yellow' },
  { id: 3, type: 'lead', title: 'New lead received', description: 'Facebook - 4BR New Construction', time: '1d ago', badge: 'green' },
  { id: 4, type: 'message', title: 'Message from John Builder', description: 'Question about fixture pricing', time: '1d ago', badge: 'purple' }
];

const upcomingDeadlines = [
  { id: 1, job: 'Lakewood Manor - Phase 2', date: 'Jan 25', status: 'urgent' },
  { id: 2, job: 'Preston Heights Development', date: 'Jan 28', status: 'upcoming' },
  { id: 3, job: 'Oak Creek Subdivision', date: 'Feb 2', status: 'upcoming' }
];

export default function Dashboard() {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
        <p className="text-slate-400 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">{stat.label}</p>
                  <p className="text-3xl font-bold text-slate-100 mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-${stat.color}-500/10`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-500`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={(value) => `$${value / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#e2e8f0' }}
                  itemStyle={{ color: '#3b82f6' }}
                  formatter={(value: number) => `$${value.toLocaleString()}`}
                />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
              </LineChart>
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
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <Badge variant={activity.badge as any}>{activity.type}</Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200">{activity.title}</p>
                    <p className="text-xs text-slate-400 mt-1">{activity.description}</p>
                  </div>
                  <span className="text-xs text-slate-500">{activity.time}</span>
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
              {upcomingDeadlines.map((deadline) => (
                <div key={deadline.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                  <div>
                    <p className="text-sm font-medium text-slate-200">{deadline.job}</p>
                    <p className="text-xs text-slate-400 mt-1">{deadline.date}</p>
                  </div>
                  <Badge variant={deadline.status === 'urgent' ? 'red' : 'yellow'}>
                    {deadline.status === 'urgent' ? 'Urgent' : 'Soon'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Button variant="primary" className="w-full justify-start">
              <PlusIcon className="w-5 h-5 mr-2" />
              New Job
            </Button>
            <Button variant="secondary" className="w-full justify-start">
              <CalculatorIcon className="w-5 h-5 mr-2" />
              Quick Estimate
            </Button>
            <Button variant="secondary" className="w-full justify-start">
              <CloudArrowUpIcon className="w-5 h-5 mr-2" />
              Upload Blueprint
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
