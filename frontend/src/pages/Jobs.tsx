import React from 'react';
import { Briefcase, Plus } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export function Jobs() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Jobs</h1>
          <p className="text-gray-600 mt-1">Manage all your plumbing jobs</p>
        </div>
        <Button>
          <Plus className="w-5 h-5" />
          New Job
        </Button>
      </div>

      <Card className="text-center py-16">
        <Briefcase className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Jobs Page</h3>
        <p className="text-gray-600 max-w-md mx-auto">
          This page will display all jobs with filtering, sorting, and detailed views.
          Features include job status tracking, timeline management, and team assignments.
        </p>
      </Card>
    </div>
  );
}
