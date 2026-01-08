import { Users } from 'lucide-react';

export default function Leads() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
        <p className="text-gray-600 mt-1">Manage customer inquiries and leads</p>
      </div>

      <div className="card text-center py-12">
        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Leads Management</h3>
        <p className="text-gray-600">Coming soon - Lead tracking and management</p>
      </div>
    </div>
  );
}
