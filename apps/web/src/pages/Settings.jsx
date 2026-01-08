import { Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Configure your PipelineOS account</p>
      </div>

      <div className="card text-center py-12">
        <SettingsIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Application Settings</h3>
        <p className="text-gray-600">Coming soon - Account and system configuration</p>
      </div>
    </div>
  );
}
