import { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Filter,
  Grid3X3,
  List,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ChevronRight,
  MoreVertical,
  Edit,
  Trash2,
  MessageSquare,
  Star,
  StarOff,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

// Lead status categories
const statuses = [
  {
    id: 'new',
    name: 'New',
    icon: AlertCircle,
    count: 8,
    gradient: 'from-blue-500 to-blue-600',
    bgLight: 'bg-blue-50',
    textColor: 'text-blue-600',
  },
  {
    id: 'contacted',
    name: 'Contacted',
    icon: Phone,
    count: 12,
    gradient: 'from-amber-500 to-amber-600',
    bgLight: 'bg-amber-50',
    textColor: 'text-amber-600',
  },
  {
    id: 'qualified',
    name: 'Qualified',
    icon: CheckCircle,
    count: 5,
    gradient: 'from-emerald-500 to-emerald-600',
    bgLight: 'bg-emerald-50',
    textColor: 'text-emerald-600',
  },
  {
    id: 'lost',
    name: 'Lost',
    icon: XCircle,
    count: 3,
    gradient: 'from-gray-400 to-gray-500',
    bgLight: 'bg-gray-50',
    textColor: 'text-gray-600',
  },
];

// Mock leads data
const mockLeads = [
  {
    id: 1,
    name: 'John Smith',
    company: 'Smith Construction LLC',
    email: 'john@smithconstruction.com',
    phone: '(555) 123-4567',
    address: '123 Main St, Austin, TX',
    status: 'new',
    source: 'Website',
    projectType: 'Commercial Plumbing',
    estimatedValue: 45000,
    notes: 'Interested in full building repiping',
    starred: true,
    createdAt: '2026-01-20',
  },
  {
    id: 2,
    name: 'Sarah Johnson',
    company: 'Johnson Homes',
    email: 'sarah@johnsonhomes.com',
    phone: '(555) 234-5678',
    address: '456 Oak Ave, Round Rock, TX',
    status: 'contacted',
    source: 'Referral',
    projectType: 'Residential New Build',
    estimatedValue: 28000,
    notes: 'Follow up next week about fixtures',
    starred: false,
    createdAt: '2026-01-18',
  },
  {
    id: 3,
    name: 'Mike Williams',
    company: 'Williams Property Management',
    email: 'mike@williamspm.com',
    phone: '(555) 345-6789',
    address: '789 Pine Rd, Cedar Park, TX',
    status: 'qualified',
    source: 'Google Ads',
    projectType: 'Multi-unit Renovation',
    estimatedValue: 85000,
    notes: 'Ready for estimate, meeting scheduled',
    starred: true,
    createdAt: '2026-01-15',
  },
  {
    id: 4,
    name: 'Emily Brown',
    company: null,
    email: 'emily.brown@email.com',
    phone: '(555) 456-7890',
    address: '321 Elm St, Georgetown, TX',
    status: 'new',
    source: 'Website',
    projectType: 'Bathroom Remodel',
    estimatedValue: 12000,
    notes: 'Requested quote for master bath',
    starred: false,
    createdAt: '2026-01-21',
  },
  {
    id: 5,
    name: 'David Lee',
    company: 'Lee Commercial Group',
    email: 'david@leecommercial.com',
    phone: '(555) 567-8901',
    address: '555 Commerce Dr, Pflugerville, TX',
    status: 'contacted',
    source: 'Trade Show',
    projectType: 'Commercial Build-out',
    estimatedValue: 120000,
    notes: 'Large project, needs detailed proposal',
    starred: true,
    createdAt: '2026-01-10',
  },
  {
    id: 6,
    name: 'Lisa Martinez',
    company: 'Martinez Restaurants',
    email: 'lisa@martinezresto.com',
    phone: '(555) 678-9012',
    address: '888 Food Court, Austin, TX',
    status: 'lost',
    source: 'Referral',
    projectType: 'Restaurant Plumbing',
    estimatedValue: 35000,
    notes: 'Went with competitor - price',
    starred: false,
    createdAt: '2026-01-05',
  },
];

export default function Leads() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [showActionsMenu, setShowActionsMenu] = useState(null);
  const [leads, setLeads] = useState(mockLeads);

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.company && lead.company.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = !selectedStatus || lead.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusInfo = (statusId) => {
    return statuses.find(s => s.id === statusId);
  };

  const toggleStar = (leadId) => {
    setLeads(leads.map(lead =>
      lead.id === leadId ? { ...lead, starred: !lead.starred } : lead
    ));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl shadow-lg shadow-violet-500/30">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-700 to-purple-600 bg-clip-text text-transparent">
              Leads
            </h1>
            <p className="text-sm text-gray-600">
              Track prospects and opportunities
            </p>
          </div>
        </div>
        <button className="btn-primary bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 shadow-violet-500/30">
          <Plus className="w-4 h-4 mr-2" />
          Add Lead
        </button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statuses.map((status) => {
          const Icon = status.icon;
          const isSelected = selectedStatus === status.id;

          return (
            <button
              key={status.id}
              onClick={() => setSelectedStatus(isSelected ? null : status.id)}
              className={`card p-4 text-left transition-all hover:scale-[1.02] ${
                isSelected
                  ? `ring-2 ring-offset-2 ring-violet-500 ${status.bgLight}`
                  : 'hover:shadow-lg'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 bg-gradient-to-r ${status.gradient} rounded-xl shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className={`text-2xl font-bold ${status.textColor}`}>
                  {status.count}
                </span>
              </div>
              <p className="font-semibold text-gray-900">{status.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">leads</p>
            </button>
          );
        })}
      </div>

      {/* Search and Filters */}
      <div className="card bg-gradient-to-br from-white to-violet-50/30">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-12 bg-white/80 backdrop-blur-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-violet-100 text-violet-700'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-violet-100 text-violet-700'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
        {selectedStatus && (
          <div className="mt-4 flex items-center">
            <span className="text-sm text-gray-500 mr-2">Filtered by:</span>
            <button
              onClick={() => setSelectedStatus(null)}
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                getStatusInfo(selectedStatus)?.bgLight
              } ${getStatusInfo(selectedStatus)?.textColor}`}
            >
              {getStatusInfo(selectedStatus)?.name}
              <span className="ml-2 hover:bg-white/50 rounded-full p-0.5">&times;</span>
            </button>
          </div>
        )}
      </div>

      {/* Leads Display */}
      {filteredLeads.length === 0 ? (
        <div className="card text-center py-16 bg-gradient-to-br from-white to-violet-50/30">
          <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-purple-100 rounded-3xl mx-auto mb-6 flex items-center justify-center">
            <Users className="w-10 h-10 text-violet-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchTerm || selectedStatus ? 'No leads found' : 'No leads yet'}
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {searchTerm || selectedStatus
              ? 'Try adjusting your search or filter criteria'
              : 'Add your first lead to start tracking prospects'
            }
          </p>
          {!searchTerm && !selectedStatus && (
            <button className="btn-primary bg-gradient-to-r from-violet-500 to-purple-500">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Lead
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLeads.map((lead, index) => {
            const status = getStatusInfo(lead.status);
            const StatusIcon = status?.icon || AlertCircle;

            return (
              <div
                key={lead.id}
                className="card hover:shadow-lg transition-all duration-300 group animate-slide-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-100 to-purple-100 rounded-xl flex items-center justify-center">
                      <span className="text-lg font-bold text-violet-600">
                        {lead.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-violet-600 transition-colors">
                        {lead.name}
                      </h3>
                      {lead.company && (
                        <p className="text-sm text-gray-500">{lead.company}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => toggleStar(lead.id)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {lead.starred ? (
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      ) : (
                        <StarOff className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => setShowActionsMenu(showActionsMenu === lead.id ? null : lead.id)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-500" />
                      </button>
                      {showActionsMenu === lead.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowActionsMenu(null)}
                          />
                          <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border py-1 z-20">
                            <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </button>
                            <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Message
                            </button>
                            <button className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 mr-2 text-gray-400" />
                    {lead.email}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                    {lead.phone}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                    {lead.address}
                  </div>
                </div>

                <div className="flex items-center flex-wrap gap-2 mb-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${status?.bgLight} ${status?.textColor}`}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {status?.name}
                  </span>
                  <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600">
                    {lead.projectType}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-lg font-bold text-violet-600">
                      {formatCurrency(lead.estimatedValue)}
                    </p>
                    <p className="text-xs text-gray-500">estimated value</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(lead.createdAt)}
                    </div>
                    <p className="text-xs text-gray-400">{lead.source}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Lead
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLeads.map((lead) => {
                  const status = getStatusInfo(lead.status);
                  const StatusIcon = status?.icon || AlertCircle;

                  return (
                    <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <button onClick={() => toggleStar(lead.id)}>
                            {lead.starred ? (
                              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                            ) : (
                              <StarOff className="w-4 h-4 text-gray-300 hover:text-gray-400" />
                            )}
                          </button>
                          <div>
                            <p className="font-medium text-gray-900">{lead.name}</p>
                            <p className="text-sm text-gray-500">{lead.company || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">{lead.email}</p>
                        <p className="text-sm text-gray-500">{lead.phone}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${status?.bgLight} ${status?.textColor}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status?.name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{lead.projectType}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-violet-600">{formatCurrency(lead.estimatedValue)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
