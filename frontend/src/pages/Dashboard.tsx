import React, { useEffect } from 'react';
import {
  Briefcase,
  FileText,
  DollarSign,
  Clock,
  TrendingUp,
  Upload,
  AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatCard } from '../components/ui/StatCard';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useJobsStore } from '../stores/useJobsStore';
import { useEstimatesStore } from '../stores/useEstimatesStore';
import {
  formatCurrency,
  formatRelativeTime,
  getJobStatusColor,
  getJobStatusLabel,
} from '../lib/utils';
import type { Job, Estimate, ActivityItem } from '../types';

export function Dashboard() {
  const { jobs, setJobs } = useJobsStore();
  const { estimates, setEstimates } = useEstimatesStore();

  // Initialize mock data
  useEffect(() => {
    const mockJobs: Job[] = [
      {
        id: 'job_1',
        jobNumber: 'JOB-2024-001',
        name: 'Riverside Apartments',
        client: 'Riverside Properties LLC',
        address: '123 Main St',
        city: 'Dallas',
        state: 'TX',
        zip: '75201',
        status: 'estimating',
        priority: 'high',
        estimatedValue: 125000,
        blueprintCount: 8,
        fixtureCount: 142,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        tags: ['Multi-Family', 'New Construction'],
      },
      {
        id: 'job_2',
        jobNumber: 'JOB-2024-002',
        name: 'Oak Street Condos',
        client: 'Oak Development Corp',
        address: '456 Oak St',
        city: 'Fort Worth',
        state: 'TX',
        zip: '76102',
        status: 'bidding',
        priority: 'urgent',
        estimatedValue: 98000,
        blueprintCount: 6,
        fixtureCount: 89,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
      },
      {
        id: 'job_3',
        jobNumber: 'JOB-2024-003',
        name: 'Trinity Tower Remodel',
        client: 'Trinity Management',
        address: '789 Trinity Blvd',
        city: 'Arlington',
        state: 'TX',
        zip: '76010',
        status: 'inProgress',
        priority: 'medium',
        estimatedValue: 67000,
        blueprintCount: 4,
        fixtureCount: 56,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      },
    ];

    const mockEstimates: Estimate[] = [
      {
        id: 'est_1',
        jobId: 'job_1',
        jobName: 'Riverside Apartments',
        estimateNumber: 'EST-2024-042',
        status: 'sent',
        totalAmount: 125000,
        lineItems: [],
        laborHours: 480,
        materialsCost: 45000,
        markup: 25,
        profitMargin: 28,
        createdBy: 'user_1',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        revisionNumber: 1,
      },
      {
        id: 'est_2',
        jobId: 'job_2',
        jobName: 'Oak Street Condos',
        estimateNumber: 'EST-2024-043',
        status: 'pending',
        totalAmount: 98000,
        lineItems: [],
        laborHours: 360,
        materialsCost: 38000,
        markup: 25,
        profitMargin: 26,
        createdBy: 'user_1',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
        revisionNumber: 1,
      },
    ];

    setJobs(mockJobs);
    setEstimates(mockEstimates);
  }, [setJobs, setEstimates]);

  // Calculate stats
  const activeJobsCount = jobs.filter((j) =>
    ['estimating', 'bidding', 'inProgress'].includes(j.status)
  ).length;

  const pendingEstimatesCount = estimates.filter((e) =>
    ['draft', 'pending', 'sent'].includes(e.status)
  ).length;

  const totalRevenue = estimates
    .filter((e) => e.status === 'approved')
    .reduce((sum, e) => sum + e.totalAmount, 0);

  // Mock recent activity
  const recentActivity: ActivityItem[] = [
    {
      id: 'act_1',
      type: 'estimate',
      action: 'Estimate sent',
      description: 'EST-2024-042 sent to Riverside Properties',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      userName: 'John Smith',
    },
    {
      id: 'act_2',
      type: 'upload',
      action: 'Blueprints uploaded',
      description: '6 blueprints uploaded for Oak Street Condos',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      userName: 'John Smith',
    },
    {
      id: 'act_3',
      type: 'job',
      action: 'Job created',
      description: 'Trinity Tower Remodel added to system',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      userName: 'John Smith',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here's what's happening today.
          </p>
        </div>
        <Link to="/upload">
          <Button size="lg">
            <Upload className="w-5 h-5" />
            Upload Blueprint
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Jobs"
          value={activeJobsCount}
          icon={<Briefcase className="w-6 h-6" />}
          color="orange"
          subtitle={`${jobs.length} total jobs`}
        />
        <StatCard
          title="Pending Estimates"
          value={pendingEstimatesCount}
          icon={<FileText className="w-6 h-6" />}
          color="navy"
          subtitle={`${estimates.length} total estimates`}
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          icon={<DollarSign className="w-6 h-6" />}
          color="success"
          trend={{ value: 12, label: 'vs last month', isPositive: true }}
        />
        <StatCard
          title="Avg Response Time"
          value="2.4 hrs"
          icon={<Clock className="w-6 h-6" />}
          color="warning"
          trend={{ value: 8, label: 'vs last month', isPositive: true }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Jobs */}
        <Card>
          <CardHeader
            title="Recent Jobs"
            action={
              <Link to="/jobs">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            }
          />
          <CardContent>
            <div className="space-y-3">
              {jobs.slice(0, 5).map((job) => (
                <Link
                  key={job.id}
                  to={`/jobs/${job.id}`}
                  className="block p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 truncate">
                          {job.name}
                        </h4>
                        <Badge
                          variant={
                            job.priority === 'urgent'
                              ? 'danger'
                              : job.priority === 'high'
                              ? 'warning'
                              : 'default'
                          }
                          size="sm"
                        >
                          {job.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {job.client} • {job.jobNumber}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span>{job.blueprintCount} blueprints</span>
                        <span>•</span>
                        <span>{job.fixtureCount} fixtures</span>
                        <span>•</span>
                        <span>{formatCurrency(job.estimatedValue)}</span>
                      </div>
                    </div>
                    <Badge size="sm" className={getJobStatusColor(job.status)}>
                      {getJobStatusLabel(job.status)}
                    </Badge>
                  </div>
                </Link>
              ))}
              {jobs.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Briefcase className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No jobs yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader title="Recent Activity" />
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
                      {activity.type === 'estimate' && (
                        <FileText className="w-4 h-4" />
                      )}
                      {activity.type === 'upload' && <Upload className="w-4 h-4" />}
                      {activity.type === 'job' && <Briefcase className="w-4 h-4" />}
                      {activity.type === 'alert' && (
                        <AlertCircle className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.action}
                    </p>
                    <p className="text-sm text-gray-600 truncate">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatRelativeTime(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader title="Performance Overview" />
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {jobs.filter((j) => j.status === 'estimating').length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Estimating</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-navy-600">
                {jobs.filter((j) => j.status === 'bidding').length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Bidding</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-success-600">
                {jobs.filter((j) => j.status === 'awarded').length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Awarded</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-600">
                {jobs.filter((j) => j.status === 'inProgress').length}
              </div>
              <div className="text-sm text-gray-600 mt-1">In Progress</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
