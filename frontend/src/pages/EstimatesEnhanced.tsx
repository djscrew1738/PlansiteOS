import { useState, useMemo } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import EmptyState from '../components/ui/EmptyState';
import { useToast } from '../components/ui/Toast';
import Combobox, { type ComboboxOption } from '../components/ui/Combobox';
import DatePicker from '../components/ui/DatePicker';
import Tooltip from '../components/ui/Tooltip';
import Toggle from '../components/ui/Toggle';
import Slider from '../components/ui/Slider';
import {
  PlusIcon,
  CalculatorIcon,
  PencilIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  ArrowPathIcon,
  TrashIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { useBids } from '../hooks/useApi';
import { EstimatesSkeleton } from './EstimatesSkeleton';
import type { BidStatus } from '../types/api';

// Status options for filter
const statusOptions: ComboboxOption[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'draft', label: 'Draft', description: 'Not yet sent' },
  { value: 'sent', label: 'Sent', description: 'Sent to client' },
  { value: 'accepted', label: 'Accepted', description: 'Client accepted' },
  { value: 'rejected', label: 'Rejected', description: 'Client rejected' },
];

export default function EstimatesEnhanced() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [minAmount, setMinAmount] = useState(0);
  const [maxAmount, setMaxAmount] = useState(100000);
  const [showArchived, setShowArchived] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const { data: bidsData, isLoading, error, refetch } = useBids(1, 50, statusFilter === 'all' ? undefined : statusFilter);
  const toast = useToast();

  // Filter and sort estimates
  const filteredEstimates = useMemo(() => {
    const bids = bidsData?.bids || [];

    return bids.filter(bid => {
      // Search filter
      const matchesSearch = !searchQuery ||
        bid.project_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bid.customer_name?.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus = statusFilter === 'all' || bid.status === statusFilter;

      // Date range filter
      const bidDate = new Date(bid.created_at);
      const matchesDateFrom = !dateFrom || bidDate >= dateFrom;
      const matchesDateTo = !dateTo || bidDate <= dateTo;

      // Amount range filter
      const matchesAmount = bid.grand_total >= minAmount && bid.grand_total <= maxAmount;

      return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo && matchesAmount;
    });
  }, [bidsData, searchQuery, statusFilter, dateFrom, dateTo, minAmount, maxAmount]);

  const stats = useMemo(() => {
    const bids = bidsData?.bids || [];
    return {
      total: bids.length,
      draft: bids.filter(b => b.status === 'draft').length,
      sent: bids.filter(b => b.status === 'sent').length,
      accepted: bids.filter(b => b.status === 'accepted').length,
      totalValue: bids.reduce((sum, b) => sum + b.grand_total, 0),
    };
  }, [bidsData]);

  const getStatusBadge = (status: BidStatus) => {
    const badges = {
      draft: { variant: 'slate' as const, label: 'Draft' },
      sent: { variant: 'blue' as const, label: 'Sent' },
      accepted: { variant: 'green' as const, label: 'Accepted' },
      rejected: { variant: 'red' as const, label: 'Rejected' },
    };
    return badges[status] || badges.draft;
  };

  if (isLoading) return <EstimatesSkeleton />;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Estimates</h1>
          <p className="mt-2 text-slate-400">
            Manage and track your project estimates
          </p>
        </div>
        <div className="flex gap-2">
          <Tooltip content="Refresh estimates list">
            <Button variant="secondary" onClick={() => refetch()} disabled={isLoading}>
              <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </Tooltip>
          <Button variant="primary">
            <PlusIcon className="w-5 h-5 mr-2" />
            New Estimate
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-sm text-slate-400">Total</p>
            <p className="text-3xl font-bold text-slate-100 mt-2">{stats.total}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-slate-400">Draft</p>
            <p className="text-3xl font-bold text-slate-100 mt-2">{stats.draft}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-slate-400">Sent</p>
            <p className="text-3xl font-bold text-blue-400 mt-2">{stats.sent}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-slate-400">Accepted</p>
            <p className="text-3xl font-bold text-green-400 mt-2">{stats.accepted}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-slate-400">Total Value</p>
            <p className="text-2xl font-bold text-slate-100 mt-2">
              ${(stats.totalValue / 1000).toFixed(1)}k
            </p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent>
          <div className="space-y-4">
            {/* Basic Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[240px]">
                <Input
                  placeholder="Search by project or customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Combobox
                options={statusOptions}
                value={statusFilter}
                onChange={(v) => setStatusFilter(v as string)}
                placeholder="Status"
                className="min-w-[180px]"
              />

              <Tooltip content={showAdvancedFilters ? "Hide advanced filters" : "Show advanced filters"}>
                <Button
                  variant={showAdvancedFilters ? "primary" : "secondary"}
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                >
                  <FunnelIcon className="w-4 h-4 mr-2" />
                  Filters
                </Button>
              </Tooltip>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="pt-4 border-t border-slate-800 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DatePicker
                    value={dateFrom}
                    onChange={setDateFrom}
                    label="From Date"
                    placeholder="Start date"
                  />
                  <DatePicker
                    value={dateTo}
                    onChange={setDateTo}
                    label="To Date"
                    placeholder="End date"
                  />
                </div>

                <div>
                  <Slider
                    value={maxAmount}
                    onChange={setMaxAmount}
                    min={0}
                    max={100000}
                    step={1000}
                    label={`Maximum Amount: $${maxAmount.toLocaleString()}`}
                    showValue={false}
                  />
                </div>

                <Toggle
                  checked={showArchived}
                  onChange={setShowArchived}
                  label="Show archived estimates"
                  description="Include estimates that have been archived"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estimates Table */}
      {filteredEstimates.length === 0 ? (
        <EmptyState
          icon={<CalculatorIcon className="w-16 h-16" />}
          title="No estimates found"
          description={searchQuery || statusFilter !== 'all' || dateFrom || dateTo
            ? "Try adjusting your filters"
            : "Create your first estimate to get started"
          }
          action={
            !searchQuery && statusFilter === 'all' ? (
              <Button variant="primary">
                <PlusIcon className="w-5 h-5 mr-2" />
                New Estimate
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {filteredEstimates.length} {filteredEstimates.length === 1 ? 'Estimate' : 'Estimates'}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEstimates.map((bid) => {
                  const statusBadge = getStatusBadge(bid.status);
                  return (
                    <TableRow key={bid.id}>
                      <TableCell className="font-mono text-xs">
                        #{bid.id.substring(0, 8)}
                      </TableCell>
                      <TableCell className="font-medium">{bid.project_name}</TableCell>
                      <TableCell>{bid.customer_name || '-'}</TableCell>
                      <TableCell>
                        {new Date(bid.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${bid.grand_total.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadge.variant}>
                          {statusBadge.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Tooltip content="View details">
                            <Button variant="ghost" size="sm">
                              <EyeIcon className="w-4 h-4" />
                            </Button>
                          </Tooltip>
                          <Tooltip content="Edit estimate">
                            <Button variant="ghost" size="sm">
                              <PencilIcon className="w-4 h-4" />
                            </Button>
                          </Tooltip>
                          <Tooltip content="Download PDF">
                            <Button variant="ghost" size="sm">
                              <ArrowDownTrayIcon className="w-4 h-4" />
                            </Button>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
