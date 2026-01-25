import { useState, useEffect, useMemo } from 'react';
import Card, { CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import Modal from '../components/ui/Modal';
import Select from '../components/ui/Select';
import { useToast } from '../components/ui/Toast';
import {
  PlusIcon,
  PhoneIcon,
  ChatBubbleLeftIcon,
  MapPinIcon,
  CalendarIcon,
  CheckCircleIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

// Lead type definition
interface Lead {
  id: string;
  name: string;
  phone: string;
  address: string;
  source: 'facebook' | 'website' | 'referral' | 'phone';
  stage: 'new' | 'contacted' | 'quoted' | 'won' | 'lost';
  notes: string;
  estimatedValue: number | null;
  createdAt: string;
}

// Kanban columns
const kanbanColumns = [
  { id: 'new', title: 'New', color: 'blue' },
  { id: 'contacted', title: 'Contacted', color: 'purple' },
  { id: 'quoted', title: 'Quoted', color: 'yellow' },
  { id: 'won', title: 'Won', color: 'green' },
  { id: 'lost', title: 'Lost', color: 'red' }
] as const;

// Initial demo leads
const initialLeads: Lead[] = [
  {
    id: '1',
    name: 'John Smith',
    phone: '(214) 555-0123',
    address: '123 Oak St, Dallas, TX',
    source: 'facebook',
    stage: 'new',
    notes: '',
    estimatedValue: null,
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    phone: '(972) 555-0456',
    address: '456 Pine Ave, Plano, TX',
    source: 'website',
    stage: 'contacted',
    notes: 'Called and left voicemail',
    estimatedValue: null,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: '3',
    name: 'Mike Williams',
    phone: '(469) 555-0789',
    address: '789 Elm Dr, Frisco, TX',
    source: 'referral',
    stage: 'quoted',
    notes: 'Referral from ABC Construction',
    estimatedValue: 28500,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    id: '4',
    name: 'Emily Davis',
    phone: '(214) 555-0321',
    address: '321 Maple Rd, Allen, TX',
    source: 'website',
    stage: 'won',
    notes: 'Contract signed!',
    estimatedValue: 24500,
    createdAt: new Date(Date.now() - 86400000 * 12).toISOString()
  }
];

// Local storage key
const LEADS_STORAGE_KEY = 'plansiteos-leads';

// Load leads from localStorage
function loadLeads(): Lead[] {
  try {
    const stored = localStorage.getItem(LEADS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load leads:', e);
  }
  return initialLeads;
}

// Save leads to localStorage
function saveLeads(leads: Lead[]) {
  localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(leads));
}

// Calculate days old from createdAt
function getDaysOld(createdAt: string): number {
  const created = new Date(createdAt);
  const now = new Date();
  return Math.floor((now.getTime() - created.getTime()) / 86400000);
}

const getSourceIcon = (source: string) => {
  const icons: Record<string, string> = {
    facebook: '📱',
    website: '🌐',
    referral: '👥',
    phone: '📞'
  };
  return icons[source] || '📋';
};

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activeSource, setActiveSource] = useState('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [showDetail, setShowDetail] = useState(false);
  const [showAddLead, setShowAddLead] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const toast = useToast();

  // New lead form state
  const [newLead, setNewLead] = useState({
    name: '',
    phone: '',
    address: '',
    source: 'website' as Lead['source'],
    notes: ''
  });

  // Load leads on mount
  useEffect(() => {
    setLeads(loadLeads());
  }, []);

  // Save leads when they change
  useEffect(() => {
    if (leads.length > 0) {
      saveLeads(leads);
    }
  }, [leads]);

  // Calculate source counts
  const leadSources = useMemo(() => {
    const counts: Record<string, number> = { all: leads.length };
    leads.forEach(lead => {
      counts[lead.source] = (counts[lead.source] || 0) + 1;
    });
    return [
      { id: 'all', label: 'All', count: counts.all || 0 },
      { id: 'facebook', label: 'Facebook', count: counts.facebook || 0 },
      { id: 'website', label: 'Website', count: counts.website || 0 },
      { id: 'referral', label: 'Referral', count: counts.referral || 0 },
      { id: 'phone', label: 'Phone', count: counts.phone || 0 }
    ];
  }, [leads]);

  const filteredLeads = leads.filter(
    lead => activeSource === 'all' || lead.source === activeSource
  );

  const getLeadsByStage = (stage: string) =>
    filteredLeads.filter(lead => lead.stage === stage);

  const handleAddLead = () => {
    if (!newLead.name.trim()) {
      toast.error('Name required', 'Please enter a name');
      return;
    }
    const lead: Lead = {
      id: crypto.randomUUID(),
      name: newLead.name.trim(),
      phone: newLead.phone.trim(),
      address: newLead.address.trim(),
      source: newLead.source,
      stage: 'new',
      notes: newLead.notes.trim(),
      estimatedValue: null,
      createdAt: new Date().toISOString()
    };
    setLeads(prev => [lead, ...prev]);
    setNewLead({ name: '', phone: '', address: '', source: 'website', notes: '' });
    setShowAddLead(false);
    toast.success('Lead added', `${lead.name} added to pipeline`);
  };

  const handleUpdateStage = (leadId: string, newStage: Lead['stage']) => {
    setLeads(prev => prev.map(lead =>
      lead.id === leadId ? { ...lead, stage: newStage } : lead
    ));
    if (selectedLead?.id === leadId) {
      setSelectedLead(prev => prev ? { ...prev, stage: newStage } : null);
    }
  };

  const handleUpdateNotes = (leadId: string, notes: string) => {
    setLeads(prev => prev.map(lead =>
      lead.id === leadId ? { ...lead, notes } : lead
    ));
  };

  const handleDeleteLead = (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    setLeads(prev => prev.filter(lead => lead.id !== leadId));
    setShowDetail(false);
    setSelectedLead(null);
    toast.success('Lead deleted');
  };

  const openLeadDetail = (lead: Lead) => {
    setSelectedLead(lead);
    setShowDetail(true);
  };

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
                      className="cursor-pointer"
                      onClick={() => openLeadDetail(lead)}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-slate-100">{lead.name}</h4>
                          <span className="text-lg">{getSourceIcon(lead.source)}</span>
                        </div>
                        {lead.phone && (
                          <div className="flex items-center text-xs text-slate-400">
                            <PhoneIcon className="w-3 h-3 mr-1" />
                            {lead.phone}
                          </div>
                        )}
                        {lead.address && (
                          <div className="flex items-start text-xs text-slate-400">
                            <MapPinIcon className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{lead.address}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                          <span className="text-xs text-slate-500">{getDaysOld(lead.createdAt)}d ago</span>
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
                  <tr key={lead.id} className="hover:bg-slate-900/50 cursor-pointer" onClick={() => openLeadDetail(lead)}>
                    <td className="px-4 py-3 text-sm text-slate-200">{lead.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">{lead.phone || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">{lead.address || '-'}</td>
                    <td className="px-4 py-3 text-sm">{getSourceIcon(lead.source)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={kanbanColumns.find(c => c.id === lead.stage)?.color as any || 'blue'}>
                        {lead.stage}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">{getDaysOld(lead.createdAt)}d</td>
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
        onClose={() => { setShowDetail(false); setSelectedLead(null); }}
        title="Lead Details"
        size="lg"
      >
        {selectedLead && (
          <div className="space-y-6">
            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Name</label>
                <p className="text-slate-100">{selectedLead.name}</p>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Source</label>
                <div className="flex items-center gap-2">
                  <span>{getSourceIcon(selectedLead.source)}</span>
                  <span className="text-slate-100 capitalize">{selectedLead.source}</span>
                </div>
              </div>
            </div>

            {/* Contact Actions */}
            {selectedLead.phone && (
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={() => window.open(`tel:${selectedLead.phone}`, '_self')}
                >
                  <PhoneIcon className="w-4 h-4 mr-2" />
                  Call
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => window.open(`sms:${selectedLead.phone}`, '_self')}
                >
                  <ChatBubbleLeftIcon className="w-4 h-4 mr-2" />
                  Text
                </Button>
              </div>
            )}

            {/* Property Details */}
            {selectedLead.address && (
              <div>
                <label className="text-xs text-slate-400 block mb-1">Property Address</label>
                <p className="text-slate-100">{selectedLead.address}</p>
              </div>
            )}

            {/* Stage Select */}
            <div>
              <label className="text-xs text-slate-400 block mb-2">Stage</label>
              <Select
                value={selectedLead.stage}
                onChange={(e) => handleUpdateStage(selectedLead.id, e.target.value as Lead['stage'])}
              >
                {kanbanColumns.map(col => (
                  <option key={col.id} value={col.id}>{col.title}</option>
                ))}
              </Select>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs text-slate-400 block mb-2">Notes</label>
              <Textarea
                rows={4}
                placeholder="Add notes about this lead..."
                value={selectedLead.notes}
                onChange={(e) => {
                  setSelectedLead(prev => prev ? { ...prev, notes: e.target.value } : null);
                }}
                onBlur={(e) => handleUpdateNotes(selectedLead.id, e.target.value)}
              />
            </div>

            {/* Activity Timeline */}
            <div>
              <label className="text-xs text-slate-400 block mb-3">Activity</label>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                  <div>
                    <p className="text-sm text-slate-200">
                      Lead received from {selectedLead.source}
                    </p>
                    <p className="text-xs text-slate-500">
                      {getDaysOld(selectedLead.createdAt)} days ago
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-between border-t border-slate-800 pt-4">
              <Button
                variant="ghost"
                className="text-red-400 hover:text-red-300"
                onClick={() => handleDeleteLead(selectedLead.id)}
              >
                <TrashIcon className="w-4 h-4 mr-2" />
                Delete
              </Button>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => { setShowDetail(false); setSelectedLead(null); }}>
                  Close
                </Button>
                {selectedLead.stage !== 'won' && (
                  <Button
                    variant="primary"
                    onClick={() => {
                      handleUpdateStage(selectedLead.id, 'won');
                      setShowDetail(false);
                      setSelectedLead(null);
                      toast.success('Lead converted', 'Marked as Won');
                    }}
                  >
                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                    Mark as Won
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Lead Modal */}
      <Modal
        isOpen={showAddLead}
        onClose={() => {
          setShowAddLead(false);
          setNewLead({ name: '', phone: '', address: '', source: 'website', notes: '' });
        }}
        title="Add New Lead"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Name *"
            placeholder="John Smith"
            value={newLead.name}
            onChange={(e) => setNewLead(prev => ({ ...prev, name: e.target.value }))}
          />
          <Input
            label="Phone"
            type="tel"
            placeholder="(214) 555-0123"
            value={newLead.phone}
            onChange={(e) => setNewLead(prev => ({ ...prev, phone: e.target.value }))}
          />
          <Input
            label="Property Address"
            placeholder="123 Oak St, Dallas, TX"
            value={newLead.address}
            onChange={(e) => setNewLead(prev => ({ ...prev, address: e.target.value }))}
          />
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Source</label>
            <Select
              value={newLead.source}
              onChange={(e) => setNewLead(prev => ({ ...prev, source: e.target.value as Lead['source'] }))}
            >
              <option value="facebook">Facebook</option>
              <option value="website">Website</option>
              <option value="referral">Referral</option>
              <option value="phone">Phone</option>
            </Select>
          </div>
          <Textarea
            label="Notes"
            rows={3}
            placeholder="Additional details..."
            value={newLead.notes}
            onChange={(e) => setNewLead(prev => ({ ...prev, notes: e.target.value }))}
          />
          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="ghost"
              onClick={() => {
                setShowAddLead(false);
                setNewLead({ name: '', phone: '', address: '', source: 'website', notes: '' });
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddLead}>
              Add Lead
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
