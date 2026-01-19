import React from 'react';
import { FileText, Plus } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export function Estimates() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Estimates</h1>
          <p className="text-gray-600 mt-1">Create and manage project estimates</p>
        </div>
        <Button>
          <Plus className="w-5 h-5" />
          New Estimate
        </Button>
      </div>

      <Card className="text-center py-16">
        <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Estimates Page</h3>
        <p className="text-gray-600 max-w-md mx-auto">
          This page will show all estimates with status tracking, line item breakdowns,
          pricing calculations, and PDF generation. Send estimates directly to clients.
        </p>
      </Card>
    </div>
  );
}
