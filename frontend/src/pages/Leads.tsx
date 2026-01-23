import { useState } from 'react';
import Card, { CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import Modal from '../components/ui/Modal';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import {
  PlusIcon,
  PhoneIcon,
  ChatBubbleLeftIcon,
  MapPinIcon,
  CalendarIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

// Mock data
const leadSources = [
  { id: 'all', label: 'All', count: 15 },
  { id: 'facebook', label: 'Facebook', count: 6 },
  { id: 'website', label: 'Website', count: 4 },
  { id: 'referral', label: 'Referral', count: 3 },
  { id: 'phone', label: 'Phone', count: 2 }
];

const kanbanColumns = [
  { id: 'new', title: 'New', color: 'blue' },
  { id: 'contacted', title: 'Contacted', color: 'purple' },
  { id: 'quoted', title: 'Quoted', color: 'yellow' },
  { id: 'won', title: 'Won', color: 'green' },
  { id: 'lost', title: 'Lost', color: 'red' }
];

const leads = [
  {
    id: 1,
    name: 'John Smith',
    phone: '(214) 555-0123',
    address: '123 Oak St, Dallas, TX',
    source: 'facebook',
    stage: 'new',
    daysOld: 1,
    estimatedValue: null
  },
  {
    id: 2,
    name: 'Sarah Johnson',
    phone: '(972) 555-0456',
    address: '456 Pine Ave, Plano, TX',
    source: 'website',
    stage: 'contacted',
    daysOld: 3,
    estimatedValue: null
  },
  {
    id: 3,
    name: 'Mike Williams',
    phone: '(469) 555-0789',
    address: '789 Elm Dr, Frisco, TX',
    source: 'referral',
    stage: 'quoted',
    daysOld: 5,
    estimatedValue: 28500
  },
  {
    id: 4,
    name: 'Emily Davis',
    phone: '(214) 555-0321',
    address: '321 Maple Rd, Allen, TX',
    source: 'website',
    stage: 'won',
    daysOld: 12,
    estimatedValue: 24500
  }
];

const getSourceIcon = (source: string) => {
  const icons = {
    facebook: '📱',
    website: '🌐',
    referral: '👥',
    phone: '📞'
  };
  return icons[source as keyof typeof icons] || '📋';
};

export default function Leads() {
  const [activeSource, setActiveSource] = useState('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [showDetail, setShowDetail] = useState(false);
  const [showAddLead, setShowAddLead] = useState(false);

  const filteredLeads = leads.filter(
    lead => activeSource === 'all' || lead.source === activeSource
  );

  const getLeadsByStage = (stage: string) =>
    filteredLeads.filter(lead => lead.stage === stage);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Leads</h1>
          <p className="text-slate-400 mt-1">Track and convert leads to jobs</p>
        </div>
        <Button variant="primary" onClick={() => setShowAddLead(true)}>
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Lead
        </Button>
      </div>

      {/* Source Tabs */}
      <Card>
        <div className="flex flex-wrap gap-2">
          {leadSources.map((source) => (
            <button
              key={source.id}
              onClick={() => setActiveSource(source.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeSource === source.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {source.label} ({source.count})
            </button>
          ))}
        </div>
      </Card>

      {/* View Toggle */}
      <div className="flex gap-2">
        <Button
          variant={viewMode === 'kanban' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('kanban')}
        >
          Kanban
        </Button>
        <Button
          variant={viewMode === 'list' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('list')}
        >
          List
        </Button>
      </div>

      {/* Kanban Board */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {kanbanColumns.map((column) => {
            const columnLeads = getLeadsByStage(column.id);
            return (
              <div key={column.id} className="flex flex-col">
                <div className="mb-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-300">{column.title}</h3>
                    <Badge variant={column.color as any}>{columnLeads.length}</Badge>
                  </div>
                </div>
                <div className="space-y-3 flex-1">
                  {columnLeads.map((lead) => (
                    <Card
                      key={lead.id}
                      hover
                      className="cursor-grab active:cursor-grabbing"
                      onClick={() => setShowDetail(true)}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-slate-100">{lead.name}</h4>
                          <span className="text-lg">{getSourceIcon(lead.source)}</span>
                        </div>
                        <div className="flex items-center text-xs text-slate-400">
                          <PhoneIcon className="w-3 h-3 mr-1" />
                          {lead.phone}
                        </div>
                        <div className="flex items-start text-xs text-slate-400">
                          <MapPinIcon className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{lead.address}</span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                          <span className="text-xs text-slate-500">{lead.daysOld}d ago</span>
                          {lead.estimatedValue && (
                            <span className="text-xs font-semibold text-blue-500">
                              ${lead.estimatedValue.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Address</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Source</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Stage</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Age</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-900/50 cursor-pointer" onClick={() => setShowDetail(true)}>
                    <td className="px-4 py-3 text-sm text-slate-200">{lead.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">{lead.phone}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">{lead.address}</td>
                    <td className="px-4 py-3 text-sm">{getSourceIcon(lead.source)}</td>
                    <td className="px-4 py-3">
                      <Badge variant="blue">{lead.stage}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">{lead.daysOld}d</td>
                    <td className="px-4 py-3 text-sm font-semibold text-blue-500">
                      {lead.estimatedValue ? `$${lead.estimatedValue.toLocaleString()}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Lead Detail Modal */}
      <Modal
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        title="Lead Details"
        size="lg"
      >
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Name</label>
              <p className="text-slate-100">John Smith</p>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Source</label>
              <div className="flex items-center gap-2">
                <span>📱</span>
                <span className="text-slate-100">Facebook</span>
              </div>
            </div>
          </div>

          {/* Contact Actions */}
          <div className="flex gap-2">
            <Button variant="primary" className="flex-1">
              <PhoneIcon className="w-4 h-4 mr-2" />
              Call
            </Button>
            <Button variant="secondary" className="flex-1">
              <ChatBubbleLeftIcon className="w-4 h-4 mr-2" />
              Text
            </Button>
          </div>

          {/* Property Details */}
          <div>
            <label className="text-xs text-slate-400 block mb-1">Property Address</label>
            <p className="text-slate-100">123 Oak St, Dallas, TX 75201</p>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-slate-400 block mb-2">Notes</label>
            <Textarea rows={4} placeholder="Add notes about this lead..." />
          </div>

          {/* Activity Timeline */}
          <div>
            <label className="text-xs text-slate-400 block mb-3">Activity</label>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                <div>
                  <p className="text-sm text-slate-200">Lead received from Facebook</p>
                  <p className="text-xs text-slate-500">1 day ago</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end border-t border-slate-800 pt-4">
            <Button variant="ghost" onClick={() => setShowDetail(false)}>
              Close
            </Button>
            <Button variant="primary">
              <CheckCircleIcon className="w-4 h-4 mr-2" />
              Convert to Job
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Lead Modal */}
      <Modal
        isOpen={showAddLead}
        onClose={() => setShowAddLead(false)}
        title="Add New Lead"
        size="md"
      >
        <div className="space-y-4">
          <Input label="Name" placeholder="John Smith" />
          <Input label="Phone" type="tel" placeholder="(214) 555-0123" />
          <Input label="Property Address" placeholder="123 Oak St, Dallas, TX" />
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Source</label>
            <select className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100">
              <option>Facebook</option>
              <option>Website</option>
              <option>Referral</option>
              <option>Phone</option>
            </select>
          </div>
          <Textarea label="Notes" rows={3} placeholder="Additional details..." />
          <div className="flex gap-3 justify-end pt-4">
            <Button variant="ghost" onClick={() => setShowAddLead(false)}>
              Cancel
            </Button>
            <Button variant="primary">
              Add Lead
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
