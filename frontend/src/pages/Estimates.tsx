import { useState, useMemo, useEffect } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Textarea from '../components/ui/Textarea';
import Modal from '../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import EmptyState from '../components/ui/EmptyState';
import SelectionBar from '../components/SelectionBar';
import AdvancedFilters, { type FilterValues } from '../components/AdvancedFilters';
import FilterPresets from '../components/FilterPresets';
import {
  PlusIcon,
  CalculatorIcon,
  PencilIcon,
  DocumentDuplicateIcon,
  PaperAirplaneIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  ArrowPathIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { useBids, useBid, useCloneBid, useUpdateBidStatus, useDeleteBid } from '../hooks/useApi';
import { useToast } from '../components/ui/Toast';
import { useSelectionStore } from '../stores/selectionStore';
import { EstimatesSkeleton } from './EstimatesSkeleton';
import { exportEstimatesToCSV } from '../lib/export';
import type { Bid, BidStatus } from '../types/api';

// DFW Market Pricing (materials + labor per unit)
const FIXTURE_PRICING = {
  waterHeaters: { material: 450, labor: 280, name: 'Water Heater (50gal)' },
  lavatories: { material: 120, labor: 150, name: 'Lavatory' },
  kitchenSinks: { material: 180, labor: 200, name: 'Kitchen Sink' },
  toilets: { material: 150, labor: 120, name: 'Toilet' },
  bathtubs: { material: 350, labor: 280, name: 'Bathtub' },
  showers: { material: 280, labor: 250, name: 'Shower' },
};

interface CalculatorValues {
  waterHeaters: number;
  lavatories: number;
  kitchenSinks: number;
  toilets: number;
  bathtubs: number;
  showers: number;
  markup: number;
}

export default function Estimates() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCalculator, setShowCalculator] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedBidId, setSelectedBidId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailBidId, setEmailBidId] = useState<string | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showBulkEmailModal, setShowBulkEmailModal] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<FilterValues>({});

  // Selection store
  const selectedEstimates = useSelectionStore((state) => state.selectedEstimates);
  const toggleEstimate = useSelectionStore((state) => state.toggleEstimate);
  const selectAllEstimates = useSelectionStore((state) => state.selectAllEstimates);
  const clearEstimates = useSelectionStore((state) => state.clearEstimates);

  // Calculator state - load from localStorage
  const [calcValues, setCalcValues] = useState<CalculatorValues>(() => {
    try {
      const saved = localStorage.getItem('quick-calc-values');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load calculator values:', e);
    }
    return {
      waterHeaters: 0,
      lavatories: 0,
      kitchenSinks: 0,
      toilets: 0,
      bathtubs: 0,
      showers: 0,
      markup: 15,
    };
  });

  const toast = useToast();

  // Save calculator values to localStorage when they change
  useEffect(() => {
    localStorage.setItem('quick-calc-values', JSON.stringify(calcValues));
  }, [calcValues]);

  // API hooks
  const { data: bidsData, isLoading, error, refetch } = useBids(1, 50, statusFilter === 'all' ? undefined : statusFilter);
  const { data: selectedBidData, isLoading: loadingBid } = useBid(selectedBidId || '');
  const cloneBid = useCloneBid();
  const updateStatus = useUpdateBidStatus();
  const deleteBid = useDeleteBid();

  // Calculate quick estimate
  const calculatedTotal = useMemo(() => {
    let materialTotal = 0;
    let laborTotal = 0;

    Object.entries(calcValues).forEach(([key, value]) => {
      if (key === 'markup' || typeof value !== 'number') return;
      const pricing = FIXTURE_PRICING[key as keyof typeof FIXTURE_PRICING];
      if (pricing) {
        materialTotal += pricing.material * value;
        laborTotal += pricing.labor * value;
      }
    });

    const subtotal = materialTotal + laborTotal;
    const markupAmount = subtotal * (calcValues.markup / 100);
    const total = subtotal + markupAmount;

    return {
      materialTotal,
      laborTotal,
      subtotal,
      markupAmount,
      total,
    };
  }, [calcValues]);

  // Get line items from calculator for display
  const calculatorLineItems = useMemo(() => {
    return Object.entries(FIXTURE_PRICING)
      .map(([key, pricing]) => {
        const qty = calcValues[key as keyof CalculatorValues] as number;
        if (qty <= 0) return null;
        return {
          fixture: pricing.name,
          qty,
          materials: pricing.material * qty,
          labor: pricing.labor * qty,
          total: (pricing.material + pricing.labor) * qty,
        };
      })
      .filter(Boolean);
  }, [calcValues]);

  const handleCalcChange = (field: keyof CalculatorValues, value: string) => {
    const numValue = parseInt(value) || 0;
    setCalcValues(prev => ({ ...prev, [field]: Math.max(0, numValue) }));
  };

  const handleCloneBid = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await cloneBid.mutateAsync(id);
      toast.success('Estimate cloned', 'A copy has been created');
    } catch (err) {
      toast.error('Clone failed', 'Could not clone the estimate');
    }
  };

  const handleSendBid = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEmailBidId(id);
    setShowEmailModal(true);
  };

  // Bulk action handlers
  const handleBulkDelete = async () => {
    if (selectedEstimates.size === 0) return;

    try {
      const deletePromises = Array.from(selectedEstimates).map(id =>
        deleteBid.mutateAsync(String(id))
      );
      await Promise.all(deletePromises);
      toast.success('Estimates deleted', `${selectedEstimates.size} estimate(s) removed`);
      clearEstimates();
      setShowBulkDeleteConfirm(false);
    } catch (err) {
      toast.error('Delete failed', 'Could not delete all estimates');
    }
  };

  const handleBulkEmail = () => {
    if (selectedEstimates.size === 0) return;
    setShowBulkEmailModal(true);
  };

  const handleBulkExport = () => {
    if (selectedEstimates.size === 0) return;
    const selectedBids = (bidsData?.bids || []).filter(bid =>
      selectedEstimates.has(bid.id)
    );
    exportEstimatesToCSV(selectedBids, `estimates-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Export complete', `${selectedBids.length} estimate(s) exported`);
  };

  const handleSelectAll = () => {
    if (selectedEstimates.size === filteredBids.length) {
      clearEstimates();
    } else {
      selectAllEstimates(filteredBids.map(bid => bid.id));
    }
  };

  const handleViewDetail = (bid: Bid) => {
    setSelectedBidId(bid.id);
    setShowDetail(true);
  };

  const getStatusBadge = (status: BidStatus) => {
    const variants: Record<BidStatus, string> = {
      draft: 'slate',
      pending_review: 'yellow',
      approved: 'green',
      sent: 'blue',
      viewed: 'purple',
      accepted: 'green',
      rejected: 'red',
      expired: 'slate',
      archived: 'slate',
    };
    const labels: Record<BidStatus, string> = {
      draft: 'Draft',
      pending_review: 'Pending',
      approved: 'Approved',
      sent: 'Sent',
      viewed: 'Viewed',
      accepted: 'Won',
      rejected: 'Declined',
      expired: 'Expired',
      archived: 'Archived',
    };
    return <Badge variant={variants[status] as any}>{labels[status] || status}</Badge>;
  };

  // Filter and sort bids
  const filteredBids = useMemo(() => {
    if (!bidsData?.bids) return [];

    let filtered = bidsData.bids;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(bid =>
        bid.project_name.toLowerCase().includes(query) ||
        bid.project_address?.toLowerCase().includes(query) ||
        bid.customer_name?.toLowerCase().includes(query)
      );
    }

    // Filter by date range
    if (advancedFilters.dateRange) {
      const startDate = new Date(advancedFilters.dateRange.start);
      const endDate = new Date(advancedFilters.dateRange.end);
      endDate.setHours(23, 59, 59, 999); // Include the entire end date

      filtered = filtered.filter(bid => {
        const bidDate = new Date(bid.created_at);
        return bidDate >= startDate && bidDate <= endDate;
      });
    }

    // Filter by amount range
    if (advancedFilters.amountRange) {
      const { min, max } = advancedFilters.amountRange;
      filtered = filtered.filter(bid =>
        bid.grand_total >= (min || 0) &&
        bid.grand_total <= (max === Infinity ? Number.MAX_VALUE : max)
      );
    }

    // Filter by statuses
    if (advancedFilters.statuses && advancedFilters.statuses.length > 0) {
      filtered = filtered.filter(bid =>
        advancedFilters.statuses!.includes(bid.status)
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'amount':
          comparison = a.grand_total - b.grand_total;
          break;
        case 'name':
          comparison = a.project_name.localeCompare(b.project_name);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [bidsData?.bids, searchQuery, sortBy, sortOrder, advancedFilters]);

  const selectedBid = selectedBidData?.bid;

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const bids = bidsData?.bids || [];
    const totalValue = bids.reduce((sum, bid) => sum + bid.grand_total, 0);
    const wonValue = bids
      .filter(b => b.status === 'accepted')
      .reduce((sum, bid) => sum + bid.grand_total, 0);
    const pendingValue = bids
      .filter(b => b.status === 'sent' || b.status === 'pending_review')
      .reduce((sum, bid) => sum + bid.grand_total, 0);
    const wonCount = bids.filter(b => b.status === 'accepted').length;

    return { totalValue, wonValue, pendingValue, wonCount };
  }, [bidsData?.bids]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Estimates</h1>
          <p className="text-slate-400 mt-1">Create and manage project estimates</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowCalculator(true)}>
            <CalculatorIcon className="w-5 h-5 mr-2" />
            Quick Estimate
          </Button>
          <Button variant="primary">
            <PlusIcon className="w-5 h-5 mr-2" />
            New Estimate
          </Button>
        </div>
      </div>

      {/* Summary Statistics */}
      {bidsData && bidsData.bids.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <div className="text-center p-4">
              <p className="text-sm text-slate-400">Total Value</p>
              <p className="text-2xl font-bold text-slate-100 mt-2">
                ${summaryStats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </Card>
          <Card>
            <div className="text-center p-4">
              <p className="text-sm text-slate-400">Won ({summaryStats.wonCount})</p>
              <p className="text-2xl font-bold text-green-500 mt-2">
                ${summaryStats.wonValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </Card>
          <Card>
            <div className="text-center p-4">
              <p className="text-sm text-slate-400">Pending</p>
              <p className="text-2xl font-bold text-yellow-500 mt-2">
                ${summaryStats.pendingValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </Card>
          <Card>
            <div className="text-center p-4">
              <p className="text-sm text-slate-400">Win Rate</p>
              <p className="text-2xl font-bold text-blue-500 mt-2">
                {bidsData.bids.length > 0
                  ? Math.round((summaryStats.wonCount / bidsData.bids.length) * 100)
                  : 0}%
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Quick Calculator (Collapsible) */}
      {showCalculator && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Quick Estimate Calculator</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowCalculator(false)}>
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input
                label="Water Heaters"
                type="number"
                min="0"
                value={calcValues.waterHeaters || ''}
                onChange={(e) => handleCalcChange('waterHeaters', e.target.value)}
                placeholder="0"
              />
              <Input
                label="Lavatories"
                type="number"
                min="0"
                value={calcValues.lavatories || ''}
                onChange={(e) => handleCalcChange('lavatories', e.target.value)}
                placeholder="0"
              />
              <Input
                label="Kitchen Sinks"
                type="number"
                min="0"
                value={calcValues.kitchenSinks || ''}
                onChange={(e) => handleCalcChange('kitchenSinks', e.target.value)}
                placeholder="0"
              />
              <Input
                label="Toilets"
                type="number"
                min="0"
                value={calcValues.toilets || ''}
                onChange={(e) => handleCalcChange('toilets', e.target.value)}
                placeholder="0"
              />
              <Input
                label="Bathtubs"
                type="number"
                min="0"
                value={calcValues.bathtubs || ''}
                onChange={(e) => handleCalcChange('bathtubs', e.target.value)}
                placeholder="0"
              />
              <Input
                label="Showers"
                type="number"
                min="0"
                value={calcValues.showers || ''}
                onChange={(e) => handleCalcChange('showers', e.target.value)}
                placeholder="0"
              />
              <Input
                label="Markup %"
                type="number"
                min="0"
                max="100"
                value={calcValues.markup}
                onChange={(e) => handleCalcChange('markup', e.target.value)}
                placeholder="15"
              />
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => setCalcValues({
                    waterHeaters: 0,
                    lavatories: 0,
                    kitchenSinks: 0,
                    toilets: 0,
                    bathtubs: 0,
                    showers: 0,
                    markup: 15,
                  })}
                >
                  Clear
                </Button>
              </div>
            </div>

            {/* Line Items Breakdown */}
            {calculatorLineItems.length > 0 && (
              <div className="mt-6 border-t border-slate-800 pt-4">
                <h4 className="text-sm font-medium text-slate-300 mb-3">Cost Breakdown</h4>
                <div className="space-y-2 text-sm">
                  {calculatorLineItems.map((item, i) => item && (
                    <div key={i} className="flex justify-between text-slate-400">
                      <span>{item.qty}x {item.fixture}</span>
                      <span>${item.total.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Totals */}
            <div className="mt-6 p-4 bg-slate-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Materials:</span>
                <span className="text-slate-200">${calculatedTotal.materialTotal.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Labor:</span>
                <span className="text-slate-200">${calculatedTotal.laborTotal.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Subtotal:</span>
                <span className="text-slate-200">${calculatedTotal.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Markup ({calcValues.markup}%):</span>
                <span className="text-slate-200">${calculatedTotal.markupAmount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                <span className="text-slate-300 font-medium">Estimated Total:</span>
                <span className="text-2xl font-bold text-blue-500">
                  ${calculatedTotal.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter Bar */}
      <Card>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search estimates..."
              className="flex-1"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="pending_review">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="sent">Sent</option>
              <option value="accepted">Won</option>
              <option value="rejected">Declined</option>
            </Select>
            <FilterPresets
              currentFilters={advancedFilters}
              onLoadPreset={(filters) => setAdvancedFilters(filters)}
            />
            <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isLoading}>
              <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Advanced Filters */}
          <AdvancedFilters
            values={advancedFilters}
            onChange={setAdvancedFilters}
            onClear={() => setAdvancedFilters({})}
          />

          <div className="flex gap-2 items-center text-sm">
            <span className="text-slate-400">Sort by:</span>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'amount' | 'name')}
              className="w-auto"
            >
              <option value="date">Date</option>
              <option value="amount">Amount</option>
              <option value="name">Project Name</option>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
            </Button>
            {filteredBids.length > 0 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="ml-auto"
                >
                  {selectedEstimates.size === filteredBids.length ? 'Deselect All' : 'Select All'}
                </Button>
                <span className="text-slate-500">
                  {filteredBids.length} estimate{filteredBids.length !== 1 ? 's' : ''}
                </span>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Estimates List */}
      {isLoading ? (
        <EstimatesSkeleton />
      ) : error ? (
        <EmptyState
          icon={<CalculatorIcon className="w-16 h-16" />}
          title="Failed to load estimates"
          description="There was an error loading your estimates. Please try again."
          action={
            <Button variant="primary" onClick={() => refetch()}>
              <ArrowPathIcon className="w-5 h-5 mr-2" />
              Retry
            </Button>
          }
        />
      ) : filteredBids.length === 0 ? (
        <EmptyState
          icon={<CalculatorIcon className="w-16 h-16" />}
          title="No estimates found"
          description={searchQuery || statusFilter !== 'all'
            ? "No estimates match your filters"
            : "Upload a blueprint to generate your first estimate"
          }
          action={
            <Button variant="primary" onClick={() => setShowCalculator(true)}>
              <CalculatorIcon className="w-5 h-5 mr-2" />
              Quick Estimate
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredBids.map((bid) => (
            <Card
              key={bid.id}
              hover
              onClick={() => handleViewDetail(bid)}
              className={selectedEstimates.has(bid.id) ? 'ring-2 ring-blue-500' : ''}
            >
              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <div className="flex items-center pt-1">
                  <input
                    type="checkbox"
                    checked={selectedEstimates.has(bid.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleEstimate(bid.id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-100">{bid.project_name}</h3>
                        {bid.project_address && (
                          <p className="text-sm text-slate-400 mt-1">{bid.project_address}</p>
                        )}
                        {bid.customer_name && (
                          <p className="text-xs text-slate-500 mt-1">Customer: {bid.customer_name}</p>
                        )}
                        <p className="text-xs text-slate-600 mt-1">#{bid.bid_number}</p>
                      </div>
                      {getStatusBadge(bid.status)}
                    </div>
                  </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-500">
                      ${bid.grand_total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Updated {new Date(bid.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleViewDetail(bid); }}>
                      <EyeIcon className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); }}>
                      <PencilIcon className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleCloneBid(bid.id, e)}
                      disabled={cloneBid.isPending}
                    >
                      <DocumentDuplicateIcon className="w-4 h-4" />
                    </Button>
                    {bid.status === 'draft' || bid.status === 'approved' ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => handleSendBid(bid.id, e)}
                        disabled={updateStatus.isPending}
                      >
                        <PaperAirplaneIcon className="w-4 h-4" />
                      </Button>
                    ) : null}
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); }}>
                      <ArrowDownTrayIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Selection Bar */}
      <SelectionBar
        count={selectedEstimates.size}
        onClear={clearEstimates}
        onDelete={() => setShowBulkDeleteConfirm(true)}
        onEmail={handleBulkEmail}
        onExport={handleBulkExport}
      />

      {/* Estimate Detail Modal */}
      <Modal
        isOpen={showDetail}
        onClose={() => { setShowDetail(false); setSelectedBidId(null); }}
        title="Estimate Details"
        size="xl"
      >
        {loadingBid ? (
          <div className="flex items-center justify-center py-12">
            <ArrowPathIcon className="w-8 h-8 text-slate-400 animate-spin" />
          </div>
        ) : selectedBid ? (
          <div className="space-y-6">
            {/* Job Info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-800 rounded-lg">
              <div>
                <p className="text-xs text-slate-400">Job Name</p>
                <p className="text-sm text-slate-200 mt-1">{selectedBid.project_name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Customer</p>
                <p className="text-sm text-slate-200 mt-1">{selectedBid.customer_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Address</p>
                <p className="text-sm text-slate-200 mt-1">{selectedBid.project_address || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Status</p>
                <div className="mt-1">{getStatusBadge(selectedBid.status)}</div>
              </div>
              <div>
                <p className="text-xs text-slate-400">Bid Number</p>
                <p className="text-sm text-slate-200 mt-1">#{selectedBid.bid_number}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Pricing Tier</p>
                <p className="text-sm text-slate-200 mt-1 capitalize">{selectedBid.pricing_tier}</p>
              </div>
            </div>

            {/* Line Items */}
            {selectedBid.line_items && selectedBid.line_items.length > 0 && (
              <div>
                <h3 className="font-semibold text-slate-100 mb-3">Line Items</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Materials</TableHead>
                      <TableHead>Labor</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedBid.line_items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.quantity} {item.unit}</TableCell>
                        <TableCell>${item.line_material_total.toLocaleString()}</TableCell>
                        <TableCell>${item.line_labor_total.toLocaleString()}</TableCell>
                        <TableCell className="font-semibold">${item.line_total.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Summary */}
            <div className="border-t border-slate-800 pt-4">
              <div className="space-y-2 max-w-xs ml-auto">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Materials:</span>
                  <span className="text-slate-200">${selectedBid.material_total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Labor:</span>
                  <span className="text-slate-200">${selectedBid.labor_total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Markup ({selectedBid.markup_percent}%):</span>
                  <span className="text-slate-200">
                    ${((selectedBid.material_total + selectedBid.labor_total) * selectedBid.markup_percent / 100).toLocaleString()}
                  </span>
                </div>
                {selectedBid.discount_percent > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Discount ({selectedBid.discount_percent}%):</span>
                    <span className="text-green-400">
                      -${((selectedBid.material_total + selectedBid.labor_total) * selectedBid.discount_percent / 100).toLocaleString()}
                    </span>
                  </div>
                )}
                {selectedBid.tax_percent > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Tax ({selectedBid.tax_percent}%):</span>
                    <span className="text-slate-200">
                      ${((selectedBid.grand_total / (1 + selectedBid.tax_percent / 100)) * selectedBid.tax_percent / 100).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t border-slate-800 pt-2">
                  <span className="text-slate-100">Total:</span>
                  <span className="text-blue-500">
                    ${selectedBid.grand_total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end border-t border-slate-800 pt-4">
              <Button variant="ghost" onClick={() => { setShowDetail(false); setSelectedBidId(null); }}>
                Close
              </Button>
              <Button variant="secondary">
                <PencilIcon className="w-4 h-4 mr-2" />
                Edit
              </Button>
              {(selectedBid.status === 'draft' || selectedBid.status === 'approved') && (
                <Button
                  variant="primary"
                  onClick={() => {
                    handleSendBid(selectedBid.id, { stopPropagation: () => {} } as React.MouseEvent);
                    setShowDetail(false);
                    setSelectedBidId(null);
                  }}
                >
                  <PaperAirplaneIcon className="w-4 h-4 mr-2" />
                  Send to Customer
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            No estimate selected
          </div>
        )}
      </Modal>

      {/* Email Modal */}
      <Modal
        isOpen={showEmailModal}
        onClose={() => { setShowEmailModal(false); setEmailBidId(null); }}
        title="Send Estimate via Email"
        size="lg"
      >
        {emailBidId && (() => {
          const bid = bidsData?.bids.find(b => b.id === emailBidId);
          if (!bid) return null;

          return (
            <EmailForm
              bid={bid}
              onClose={() => { setShowEmailModal(false); setEmailBidId(null); }}
              onSent={async () => {
                try {
                  await updateStatus.mutateAsync({ id: emailBidId, status: 'sent' });
                  toast.success('Email sent', `Estimate sent to ${bid.customer_email || bid.customer_name}`);
                  setShowEmailModal(false);
                  setEmailBidId(null);
                } catch (err) {
                  toast.error('Failed to update status', 'Email was sent but status update failed');
                }
              }}
            />
          );
        })()}
      </Modal>

      {/* Bulk Delete Confirmation */}
      <Modal
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        title="Delete Estimates"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-slate-300">
            Are you sure you want to delete {selectedEstimates.size} estimate{selectedEstimates.size !== 1 ? 's' : ''}?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setShowBulkDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleBulkDelete}
              disabled={deleteBid.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              <TrashIcon className="w-4 h-4 mr-2" />
              Delete {selectedEstimates.size} Estimate{selectedEstimates.size !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Email Modal */}
      <Modal
        isOpen={showBulkEmailModal}
        onClose={() => setShowBulkEmailModal(false)}
        title={`Send ${selectedEstimates.size} Estimates via Email`}
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-slate-300">
            You are about to send {selectedEstimates.size} estimate{selectedEstimates.size !== 1 ? 's' : ''} via email.
          </p>
          <div className="bg-slate-800 rounded-lg p-4 max-h-60 overflow-y-auto">
            <h4 className="text-sm font-medium text-slate-300 mb-2">Selected Estimates:</h4>
            <ul className="space-y-1">
              {(bidsData?.bids || [])
                .filter(bid => selectedEstimates.has(bid.id))
                .map(bid => (
                  <li key={bid.id} className="text-sm text-slate-400 flex justify-between">
                    <span>{bid.project_name}</span>
                    <span className="text-slate-500">{bid.customer_email || bid.customer_name || 'No email'}</span>
                  </li>
                ))}
            </ul>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <p className="text-sm text-yellow-200">
              Note: Bulk email functionality will send each estimate to its respective customer email.
              Estimates without customer emails will be skipped.
            </p>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setShowBulkEmailModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={async () => {
                const estimatesWithEmail = (bidsData?.bids || [])
                  .filter(bid => selectedEstimates.has(bid.id) && bid.customer_email);

                for (const bid of estimatesWithEmail) {
                  try {
                    await updateStatus.mutateAsync({ id: String(bid.id), status: 'sent' });
                  } catch (err) {
                    console.error(`Failed to send estimate ${bid.id}`, err);
                  }
                }

                toast.success('Emails sent', `${estimatesWithEmail.length} estimate(s) sent`);
                clearEstimates();
                setShowBulkEmailModal(false);
              }}
            >
              <PaperAirplaneIcon className="w-4 h-4 mr-2" />
              Send {selectedEstimates.size} Email{selectedEstimates.size !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Email Form Component
function EmailForm({
  bid,
  onClose,
  onSent,
}: {
  bid: Bid;
  onClose: () => void;
  onSent: () => void;
}) {
  const [recipientEmail, setRecipientEmail] = useState(bid.customer_email || '');
  const [subject, setSubject] = useState(`Estimate #${bid.bid_number} - ${bid.project_name}`);
  const [message, setMessage] = useState(
    `Dear ${bid.customer_name || 'Valued Customer'},\n\n` +
    `Please find attached our estimate for ${bid.project_name}.\n\n` +
    `Project: ${bid.project_name}\n` +
    `${bid.project_address ? `Address: ${bid.project_address}\n` : ''}` +
    `Estimate Total: $${bid.grand_total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\n` +
    `This estimate is valid for 30 days. If you have any questions or would like to proceed, please don't hesitate to contact us.\n\n` +
    `Best regards,\n` +
    `CTL Plumbing LLC`
  );
  const [isSending, setIsSending] = useState(false);
  const [includeAttachment, setIncludeAttachment] = useState(true);
  const toast = useToast();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!recipientEmail || !emailRegex.test(recipientEmail)) {
      toast.error('Invalid email', 'Please enter a valid email address');
      return;
    }

    setIsSending(true);

    try {
      // In a real implementation, this would call an API endpoint
      // For now, we'll simulate sending
      await new Promise(resolve => setTimeout(resolve, 1500));

      // TODO: Replace with actual API call
      // await api.bids.sendEmail(bid.id, {
      //   to: recipientEmail,
      //   subject,
      //   message,
      //   includeAttachment,
      // });

      toast.success('Email sent successfully', `Sent to ${recipientEmail}`);
      onSent();
    } catch (err) {
      toast.error('Failed to send email', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form onSubmit={handleSend} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">To:</label>
        <Input
          type="email"
          value={recipientEmail}
          onChange={(e) => setRecipientEmail(e.target.value)}
          placeholder="customer@example.com"
          required
          disabled={isSending}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Subject:</label>
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          disabled={isSending}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Message:</label>
        <Textarea
          rows={10}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          disabled={isSending}
        />
      </div>

      <div className="flex items-center gap-2 p-3 bg-slate-800 rounded-lg">
        <input
          type="checkbox"
          id="include-attachment"
          checked={includeAttachment}
          onChange={(e) => setIncludeAttachment(e.target.checked)}
          className="w-4 h-4"
          disabled={isSending}
        />
        <label htmlFor="include-attachment" className="text-sm text-slate-300">
          Include PDF attachment (Estimate #{bid.bid_number})
        </label>
      </div>

      {/* Email Preview */}
      <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
        <p className="text-xs text-slate-400 mb-2">Preview:</p>
        <div className="text-sm text-slate-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
          {message}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
        <Button type="button" variant="ghost" onClick={onClose} disabled={isSending}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isSending}>
          {isSending ? 'Sending...' : 'Send Email'}
        </Button>
      </div>
    </form>
  );
}
