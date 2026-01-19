import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  MoreVertical,
  Edit,
  Trash2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select, SelectOption } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Tabs } from '../components/ui/Tabs';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { useJobsStore } from '../stores/useJobsStore';
import {
  formatCurrency,
  formatDate,
  getJobStatusColor,
  getJobStatusLabel,
} from '../lib/utils';
import type { Job, JobStatus } from '../types';

export function Jobs() {
  const { jobs } = useJobsStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<JobStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('updatedAt');
  const [activeTab, setActiveTab] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Filter and sort jobs
  const filteredJobs = useMemo(() => {
    let filtered = jobs;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (job) =>
          job.name.toLowerCase().includes(query) ||
          job.client.toLowerCase().includes(query) ||
          job.jobNumber.toLowerCase().includes(query) ||
          job.city.toLowerCase().includes(query)
      );
    }

    // Status filter (tab)
    if (activeTab !== 'all') {
      filtered = filtered.filter((job) => job.status === activeTab);
    }

    // Priority filter
    if (filterPriority !== 'all') {
      filtered = filtered.filter((job) => job.priority === filterPriority);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'updatedAt') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      if (sortBy === 'createdAt') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'value') {
        return b.estimatedValue - a.estimatedValue;
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

    return filtered;
  }, [jobs, searchQuery, activeTab, filterPriority, sortBy]);

  // Calculate counts for tabs
  const statusCounts = useMemo(() => {
    return {
      all: jobs.length,
      estimating: jobs.filter((j) => j.status === 'estimating').length,
      bidding: jobs.filter((j) => j.status === 'bidding').length,
      awarded: jobs.filter((j) => j.status === 'awarded').length,
      inProgress: jobs.filter((j) => j.status === 'inProgress').length,
      onHold: jobs.filter((j) => j.status === 'onHold').length,
      completed: jobs.filter((j) => j.status === 'completed').length,
      cancelled: jobs.filter((j) => j.status === 'cancelled').length,
    };
  }, [jobs]);

  const tabs = [
    { id: 'all', label: 'All Jobs', badge: statusCounts.all },
    { id: 'estimating', label: 'Estimating', badge: statusCounts.estimating },
    { id: 'bidding', label: 'Bidding', badge: statusCounts.bidding },
    { id: 'awarded', label: 'Awarded', badge: statusCounts.awarded },
    { id: 'inProgress', label: 'In Progress', badge: statusCounts.inProgress },
    { id: 'completed', label: 'Completed', badge: statusCounts.completed },
  ];

  const priorityOptions: SelectOption[] = [
    { label: 'All Priorities', value: 'all' },
    { label: 'Urgent', value: 'urgent' },
    { label: 'High', value: 'high' },
    { label: 'Medium', value: 'medium' },
    { label: 'Low', value: 'low' },
  ];

  const sortOptions: SelectOption[] = [
    { label: 'Recently Updated', value: 'updatedAt' },
    { label: 'Recently Created', value: 'createdAt' },
    { label: 'Highest Value', value: 'value' },
    { label: 'Name (A-Z)', value: 'name' },
  ];

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, any> = {
      urgent: 'danger',
      high: 'warning',
      medium: 'default',
      low: 'default',
    };
    return variants[priority] || 'default';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Jobs</h1>
          <p className="text-gray-600 mt-1">
            Manage all your plumbing jobs and projects
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-5 h-5" />
          New Job
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search jobs, clients, or locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="md:col-span-1"
            >
              <Search className="w-5 h-5 text-gray-400" />
            </Input>
            <Select
              options={priorityOptions}
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            />
            <Select
              options={sortOptions}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Status Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Jobs Grid */}
      {filteredJobs.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredJobs.map((job) => (
            <Card key={job.id} className="hover:shadow-ctl-lg transition-shadow">
              <CardContent>
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/jobs/${job.id}`}
                        className="text-lg font-bold text-gray-900 hover:text-orange-600 transition-colors"
                      >
                        {job.name}
                      </Link>
                      <p className="text-sm text-gray-600">{job.jobNumber}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={getPriorityBadge(job.priority)}
                        size="sm"
                      >
                        {job.priority}
                      </Badge>
                      <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <Badge size="sm" className={getJobStatusColor(job.status)}>
                    {getJobStatusLabel(job.status)}
                  </Badge>

                  {/* Client */}
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Briefcase className="w-4 h-4 text-gray-400" />
                    <span>{job.client}</span>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>
                      {job.city}, {job.state} {job.zip}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-200">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">
                        {formatCurrency(job.estimatedValue)}
                      </div>
                      <div className="text-xs text-gray-500">Est. Value</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">
                        {job.blueprintCount}
                      </div>
                      <div className="text-xs text-gray-500">Blueprints</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">
                        {job.fixtureCount}
                      </div>
                      <div className="text-xs text-gray-500">Fixtures</div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div className="text-xs text-gray-500">
                      Updated {formatDate(job.updatedAt)}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedJob(job)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Link to={`/jobs/${job.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Briefcase}
          title={searchQuery ? 'No jobs found' : 'No jobs yet'}
          description={
            searchQuery
              ? 'Try adjusting your search or filters'
              : 'Create your first job to get started with project management'
          }
          action={
            !searchQuery
              ? {
                  label: 'Create Job',
                  onClick: () => setIsCreateModalOpen(true),
                  icon: <Plus className="w-5 h-5" />,
                }
              : undefined
          }
        />
      )}

      {/* Create Job Modal (placeholder) */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Job"
        size="lg"
      >
        <div className="space-y-4">
          <Input label="Job Name" placeholder="e.g., Riverside Apartments" />
          <Input label="Client Name" placeholder="e.g., ABC Properties LLC" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="City" placeholder="Dallas" />
            <Input label="State" placeholder="TX" />
          </div>
          <Input
            label="Estimated Value"
            type="number"
            placeholder="125000"
          />
          <Select
            label="Priority"
            options={[
              { label: 'Low', value: 'low' },
              { label: 'Medium', value: 'medium' },
              { label: 'High', value: 'high' },
              { label: 'Urgent', value: 'urgent' },
            ]}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => setIsCreateModalOpen(false)}>
              Create Job
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
