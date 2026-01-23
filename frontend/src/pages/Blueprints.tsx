import { useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import EmptyState from '../components/ui/EmptyState';
import { CloudArrowUpIcon, MagnifyingGlassIcon, Squares2X2Icon, ListBulletIcon, EyeIcon, ArrowDownTrayIcon, TrashIcon } from '@heroicons/react/24/outline';
import { DocumentTextIcon } from '@heroicons/react/24/solid';

// Mock data
const blueprints = [
  {
    id: 1,
    filename: 'westlake-apts-building-c.pdf',
    jobName: 'Westlake Apartments - Building C',
    date: '2026-01-20',
    status: 'analyzed',
    fixtureCount: 48,
    thumbnail: '/api/placeholder/200/140'
  },
  {
    id: 2,
    filename: 'highland-park-townhomes.pdf',
    jobName: 'Highland Park Townhomes',
    date: '2026-01-19',
    status: 'pending',
    fixtureCount: null,
    thumbnail: '/api/placeholder/200/140'
  },
  {
    id: 3,
    filename: 'preston-heights-phase1.pdf',
    jobName: 'Preston Heights - Phase 1',
    date: '2026-01-18',
    status: 'completed',
    fixtureCount: 62,
    thumbnail: '/api/placeholder/200/140'
  }
];

export default function Blueprints() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBlueprints, setSelectedBlueprints] = useState<number[]>([]);

  const getStatusBadge = (status: string) => {
    const variants = {
      analyzed: 'blue',
      pending: 'yellow',
      completed: 'green'
    };
    return <Badge variant={variants[status as keyof typeof variants] as any}>{status}</Badge>;
  };

  const toggleSelection = (id: number) => {
    setSelectedBlueprints(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const filteredBlueprints = blueprints.filter(bp => {
    const matchesStatus = statusFilter === 'all' || bp.status === statusFilter;
    const matchesSearch = bp.jobName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bp.filename.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Blueprints</h1>
          <p className="text-slate-400 mt-1">Upload and analyze construction blueprints</p>
        </div>
        <Button variant="primary">
          <CloudArrowUpIcon className="w-5 h-5 mr-2" />
          Upload Blueprint
        </Button>
      </div>

      {/* Upload Zone */}
      <Card className="border-2 border-dashed border-slate-700 bg-slate-900/50 hover:border-blue-500/50 transition-colors">
        <div className="text-center py-12">
          <CloudArrowUpIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-300 mb-2">Drop blueprints here</h3>
          <p className="text-sm text-slate-500 mb-4">or click to browse your files</p>
          <p className="text-xs text-slate-600">Supports: PDF, PNG, JPG (max 50MB)</p>
        </div>
      </Card>

      {/* Filter Bar */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search blueprints..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="analyzed">Analyzed</option>
            <option value="completed">Completed</option>
          </Select>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Squares2X2Icon className="w-5 h-5" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <ListBulletIcon className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Bulk Actions */}
      {selectedBlueprints.length > 0 && (
        <Card className="border-blue-500">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300">{selectedBlueprints.length} selected</span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm">
                Batch Analyze
              </Button>
              <Button variant="danger" size="sm">
                <TrashIcon className="w-4 h-4 mr-2" />
                Delete Selected
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Blueprints Grid/List */}
      {filteredBlueprints.length === 0 ? (
        <EmptyState
          icon={<DocumentTextIcon className="w-16 h-16" />}
          title="No blueprints found"
          description="Upload your first blueprint to get started with AI-powered analysis"
          action={
            <Button variant="primary">
              <CloudArrowUpIcon className="w-5 h-5 mr-2" />
              Upload Blueprint
            </Button>
          }
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBlueprints.map((blueprint) => (
            <Card key={blueprint.id} hover className="overflow-hidden">
              <div className="relative">
                <div className="aspect-video bg-slate-800 flex items-center justify-center">
                  <DocumentTextIcon className="w-12 h-12 text-slate-600" />
                </div>
                <div className="absolute top-2 left-2">
                  <input
                    type="checkbox"
                    checked={selectedBlueprints.includes(blueprint.id)}
                    onChange={() => toggleSelection(blueprint.id)}
                    className="w-5 h-5 rounded border-slate-600 bg-slate-800"
                  />
                </div>
                <div className="absolute top-2 right-2">
                  {getStatusBadge(blueprint.status)}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-slate-100 truncate">{blueprint.jobName}</h3>
                <p className="text-xs text-slate-400 mt-1 truncate">{blueprint.filename}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-slate-500">{blueprint.date}</span>
                  {blueprint.fixtureCount && (
                    <span className="text-xs text-slate-400">{blueprint.fixtureCount} fixtures</span>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="secondary" size="sm" className="flex-1">
                    <EyeIcon className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button variant="ghost" size="sm">
                    <ArrowDownTrayIcon className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                    <input type="checkbox" className="w-4 h-4" />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Job Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Filename</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Fixtures</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredBlueprints.map((blueprint) => (
                  <tr key={blueprint.id} className="hover:bg-slate-900/50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedBlueprints.includes(blueprint.id)}
                        onChange={() => toggleSelection(blueprint.id)}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-200">{blueprint.jobName}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">{blueprint.filename}</td>
                    <td className="px-4 py-3">{getStatusBadge(blueprint.status)}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">
                      {blueprint.fixtureCount || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">{blueprint.date}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <EyeIcon className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <ArrowDownTrayIcon className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
