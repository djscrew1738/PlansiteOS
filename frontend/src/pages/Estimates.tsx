import { useState } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import EmptyState from '../components/ui/EmptyState';
import {
  PlusIcon,
  CalculatorIcon,
  PencilIcon,
  DocumentDuplicateIcon,
  PaperAirplaneIcon,
  ArrowDownTrayIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

// Mock data
const estimates = [
  {
    id: 1,
    jobName: 'Westlake Apartments - Building C',
    address: '123 Westlake Dr, Dallas, TX',
    builder: 'ABC Construction',
    amount: 28500,
    status: 'sent',
    created: '2026-01-20',
    updated: '2026-01-21'
  },
  {
    id: 2,
    jobName: 'Highland Park Townhomes',
    address: '456 Highland Ave, Plano, TX',
    builder: 'XYZ Builders',
    amount: 24500,
    status: 'approved',
    created: '2026-01-19',
    updated: '2026-01-20'
  },
  {
    id: 3,
    jobName: 'Preston Heights - Phase 1',
    address: '789 Preston Rd, Frisco, TX',
    builder: 'BuildRight LLC',
    amount: 31200,
    status: 'draft',
    created: '2026-01-18',
    updated: '2026-01-18'
  }
];

const lineItems = [
  { fixture: 'Water Heater (50gal)', qty: 8, materials: 3200, labor: 2400, total: 5600 },
  { fixture: 'Lavatory', qty: 16, materials: 1600, labor: 2000, total: 3600 },
  { fixture: 'Kitchen Sink', qty: 8, materials: 1200, labor: 1600, total: 2800 },
  { fixture: 'Toilet', qty: 16, materials: 1600, labor: 1600, total: 3200 },
  { fixture: 'Bathtub', qty: 8, materials: 2400, labor: 2000, total: 4400 }
];

export default function Estimates() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCalculator, setShowCalculator] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: 'slate',
      sent: 'blue',
      approved: 'green',
      declined: 'red'
    };
    return <Badge variant={variants[status as keyof typeof variants] as any}>{status}</Badge>;
  };

  const filteredEstimates = estimates.filter(
    est => statusFilter === 'all' || est.status === statusFilter
  );

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
              <Input label="Water Heaters" type="number" placeholder="0" />
              <Input label="Lavatories" type="number" placeholder="0" />
              <Input label="Kitchen Sinks" type="number" placeholder="0" />
              <Input label="Toilets" type="number" placeholder="0" />
              <Input label="Bathtubs" type="number" placeholder="0" />
              <Input label="Showers" type="number" placeholder="0" />
              <Input label="Markup %" type="number" placeholder="15" />
              <div className="flex items-end">
                <Button variant="primary" className="w-full">Calculate</Button>
              </div>
            </div>
            <div className="mt-6 p-4 bg-slate-800 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Estimated Total:</span>
                <span className="text-2xl font-bold text-blue-500">$0.00</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter Bar */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <Input placeholder="Search estimates..." className="flex-1" />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="approved">Approved</option>
            <option value="declined">Declined</option>
          </Select>
          <Select>
            <option value="all">All Builders</option>
            <option value="abc">ABC Construction</option>
            <option value="xyz">XYZ Builders</option>
          </Select>
        </div>
      </Card>

      {/* Estimates List */}
      {filteredEstimates.length === 0 ? (
        <EmptyState
          icon={<CalculatorIcon className="w-16 h-16" />}
          title="No estimates found"
          description="Create your first estimate to get started"
          action={
            <Button variant="primary">
              <PlusIcon className="w-5 h-5 mr-2" />
              New Estimate
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredEstimates.map((estimate) => (
            <Card key={estimate.id} hover onClick={() => setShowDetail(true)}>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-100">{estimate.jobName}</h3>
                      <p className="text-sm text-slate-400 mt-1">{estimate.address}</p>
                      <p className="text-xs text-slate-500 mt-1">Builder: {estimate.builder}</p>
                    </div>
                    {getStatusBadge(estimate.status)}
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-500">
                      ${estimate.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Updated {estimate.updated}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <EyeIcon className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <PencilIcon className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <DocumentDuplicateIcon className="w-4 h-4" />
                    </Button>
                    <Button variant="secondary" size="sm">
                      <PaperAirplaneIcon className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <ArrowDownTrayIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Estimate Detail Modal */}
      <Modal
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        title="Estimate Details"
        size="xl"
      >
        <div className="space-y-6">
          {/* Job Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-800 rounded-lg">
            <div>
              <p className="text-xs text-slate-400">Job Name</p>
              <p className="text-sm text-slate-200 mt-1">Westlake Apartments - Building C</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Builder</p>
              <p className="text-sm text-slate-200 mt-1">ABC Construction</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Address</p>
              <p className="text-sm text-slate-200 mt-1">123 Westlake Dr, Dallas, TX</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Status</p>
              <div className="mt-1">{getStatusBadge('sent')}</div>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <h3 className="font-semibold text-slate-100 mb-3">Line Items</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fixture</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Materials</TableHead>
                  <TableHead>Labor</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineItems.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell>{item.fixture}</TableCell>
                    <TableCell>{item.qty}</TableCell>
                    <TableCell>${item.materials.toLocaleString()}</TableCell>
                    <TableCell>${item.labor.toLocaleString()}</TableCell>
                    <TableCell className="font-semibold">${item.total.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Summary */}
          <div className="border-t border-slate-800 pt-4">
            <div className="space-y-2 max-w-xs ml-auto">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Subtotal:</span>
                <span className="text-slate-200">$19,600</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Markup (15%):</span>
                <span className="text-slate-200">$2,940</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Tax (8.25%):</span>
                <span className="text-slate-200">$1,860</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-slate-800 pt-2">
                <span className="text-slate-100">Total:</span>
                <span className="text-blue-500">$24,400</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end border-t border-slate-800 pt-4">
            <Button variant="ghost" onClick={() => setShowDetail(false)}>
              Close
            </Button>
            <Button variant="secondary">
              <PencilIcon className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button variant="primary">
              <PaperAirplaneIcon className="w-4 h-4 mr-2" />
              Send to Builder
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
