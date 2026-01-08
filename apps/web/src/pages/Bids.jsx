import { FileCheck } from 'lucide-react';

export default function Bids() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bids</h1>
        <p className="text-gray-600 mt-1">Generate and manage project bids</p>
      </div>

      <div className="card text-center py-12">
        <FileCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Bid Generation</h3>
        <p className="text-gray-600">Coming soon - Automated bid generation from blueprints</p>
      </div>
    </div>
  );
}
