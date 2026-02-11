import { useState, useMemo } from 'react';
import { JOBS_DATA, type Job } from '../lib/blueprintData';
import Badge from '../components/ui/Badge';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { cn } from '../lib/utils';
import {
  WrenchScrewdriverIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

const PHASE_BADGE_VARIANTS: Record<string, 'yellow' | 'green' | 'blue'> = {
  'Rough-In': 'yellow',
  'Top-Out': 'green',
  'Trim-Out': 'green',
  Inspection: 'blue',
  Scheduled: 'blue',
};

function ProgressBar({ progress, color }: { progress: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${progress}%` }}
        />
      </div>
      <span
        className={cn(
          'font-mono text-xs font-semibold',
          progress === 0
            ? 'text-slate-500'
            : progress >= 60
            ? 'text-emerald-400'
            : 'text-cyan-400'
        )}
      >
        {progress}%
      </span>
    </div>
  );
}

export default function ActiveJobs() {
  const [searchQuery, setSearchQuery] = useState('');
  const [phaseFilter, setPhaseFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'progress' | 'due'>('due');

  const filteredJobs = useMemo(() => {
    let jobs = [...JOBS_DATA];

    // Filter by search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      jobs = jobs.filter(
        (j) =>
          j.name.toLowerCase().includes(q) || j.builder.toLowerCase().includes(q)
      );
    }

    // Filter by phase
    if (phaseFilter !== 'all') {
      jobs = jobs.filter((j) => j.phase === phaseFilter);
    }

    // Sort
    jobs.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'progress':
          return b.progress - a.progress;
        case 'due':
        default:
          return a.dueDate.localeCompare(b.dueDate);
      }
    });

    return jobs;
  }, [searchQuery, phaseFilter, sortBy]);

  // Stats
  const totalValue = JOBS_DATA.reduce((sum, j) => {
    const val = parseInt(j.value.replace(/[$,]/g, ''));
    return sum + val;
  }, 0);

  const avgProgress = Math.round(
    JOBS_DATA.reduce((sum, j) => sum + j.progress, 0) / JOBS_DATA.length
  );

  const activeCount = JOBS_DATA.filter((j) => j.progress > 0 && j.progress < 100).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Active Jobs</h1>
          <p className="text-slate-400 mt-1">Track progress on all current plumbing projects</p>
        </div>
        <Button variant="primary">
          <PlusIcon className="w-5 h-5 mr-2" />
          New Job
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-cyan-600" />
            <div className="pt-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Active Jobs
              </p>
              <p className="font-mono text-2xl font-bold text-cyan-400">
                {JOBS_DATA.length}
              </p>
              <p className="font-mono text-[11px] text-emerald-400 mt-1">
                {activeCount} in progress
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 to-emerald-600" />
            <div className="pt-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Avg Progress
              </p>
              <p className="font-mono text-2xl font-bold text-emerald-400">{avgProgress}%</p>
              <p className="font-mono text-[11px] text-emerald-400 mt-1">Across all jobs</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-400 to-orange-600" />
            <div className="pt-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Total Pipeline
              </p>
              <p className="font-mono text-2xl font-bold text-orange-400">
                ${(totalValue / 1000).toFixed(1)}k
              </p>
              <p className="font-mono text-[11px] text-emerald-400 mt-1">Combined job value</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400 to-purple-600" />
            <div className="pt-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Due This Week
              </p>
              <p className="font-mono text-2xl font-bold text-purple-400">2</p>
              <p className="font-mono text-[11px] text-emerald-400 mt-1">Upcoming deadlines</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search jobs or builders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={phaseFilter} onChange={(e) => setPhaseFilter(e.target.value)}>
            <option value="all">All Phases</option>
            <option value="Rough-In">Rough-In</option>
            <option value="Top-Out">Top-Out</option>
            <option value="Trim-Out">Trim-Out</option>
            <option value="Inspection">Inspection</option>
            <option value="Scheduled">Scheduled</option>
          </Select>
          <Select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
            <option value="due">Sort by Due Date</option>
            <option value="progress">Sort by Progress</option>
            <option value="name">Sort by Name</option>
          </Select>
        </div>
      </Card>

      {/* Jobs Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-700/80 bg-slate-800/50 font-bold">
                  Job
                </th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-700/80 bg-slate-800/50 font-bold">
                  Builder
                </th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-700/80 bg-slate-800/50 font-bold">
                  Phase
                </th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-700/80 bg-slate-800/50 font-bold">
                  Progress
                </th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-700/80 bg-slate-800/50 font-bold">
                  Value
                </th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-700/80 bg-slate-800/50 font-bold">
                  Start
                </th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-700/80 bg-slate-800/50 font-bold">
                  Due
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((job) => (
                <tr
                  key={job.id}
                  className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3.5 border-b border-slate-700/50 text-slate-100 font-semibold">
                    {job.name}
                  </td>
                  <td className="px-4 py-3.5 border-b border-slate-700/50 text-slate-400">
                    {job.builder}
                  </td>
                  <td className="px-4 py-3.5 border-b border-slate-700/50">
                    <Badge
                      variant={PHASE_BADGE_VARIANTS[job.phase] || 'blue'}
                      size="sm"
                    >
                      {job.phase}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5 border-b border-slate-700/50">
                    <ProgressBar
                      progress={job.progress}
                      color={job.progress >= 60 ? 'bg-emerald-400' : 'bg-cyan-400'}
                    />
                  </td>
                  <td className="px-4 py-3.5 border-b border-slate-700/50 font-mono font-semibold text-slate-200">
                    {job.value}
                  </td>
                  <td className="px-4 py-3.5 border-b border-slate-700/50 text-slate-400">
                    {job.startDate}
                  </td>
                  <td className="px-4 py-3.5 border-b border-slate-700/50 text-slate-400">
                    {job.dueDate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredJobs.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <WrenchScrewdriverIcon className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="text-sm">No jobs match your search criteria</p>
          </div>
        )}
      </Card>
    </div>
  );
}
