/**
 * Blueprint Intelligence Studio
 * Premium CAD-lite blueprint viewing with AI insights
 */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import BlueprintCanvas from '../components/BlueprintCanvas';
import { useToast } from '../components/ui/Toast';
import {
  ArrowLeftIcon,
  CurrencyDollarIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ChartBarIcon,
  WrenchScrewdriverIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { useBlueprint, useBlueprintSummary, useGenerateBid } from '../hooks/useApi';
import { blueprintsApi } from '../lib/api';
import type { BlueprintStatus } from '../types/api';

// Status badge mapping
const statusBadges: Record<BlueprintStatus, { variant: 'blue' | 'yellow' | 'green' | 'red'; label: string }> = {
  pending: { variant: 'blue', label: 'Pending' },
  processing: { variant: 'yellow', label: 'Processing' },
  'processed-dxf': { variant: 'green', label: 'DXF Processed' },
  completed: { variant: 'green', label: 'Completed' },
  failed: { variant: 'red', label: 'Failed' },
};

export default function BlueprintStudio() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [showAIInsights, setShowAIInsights] = useState(true);

  // API hooks
  const { data: blueprintData, isLoading } = useBlueprint(id || '');
  const { data: summaryData } = useBlueprintSummary(id || '');
  const generateBidMutation = useGenerateBid();

  const blueprint = blueprintData?.blueprint;
  const summary = summaryData?.summary;

  const handleGenerateBid = async () => {
    if (!id) return;
    try {
      const result = await generateBidMutation.mutateAsync({ blueprintId: id });
      toast.success('Estimate generated', `Estimate #${result.bid.bid_number} created`);
      navigate('/estimates');
    } catch (err) {
      toast.error('Failed to generate estimate', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  if (isLoading || !blueprint) {
    return (
      <div className="flex items-center justify-center py-24">
        <ArrowPathIcon className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  const statusInfo = statusBadges[blueprint.status] || { variant: 'blue', label: blueprint.status };

  // AI Insights (simulated - would come from API)
  const aiInsights = {
    stackDetection: [
      { floor: '1st Floor', count: 3, location: 'Kitchen, Bath 1, Bath 2' },
      { floor: '2nd Floor', count: 2, location: 'Master Bath, Hall Bath' },
    ],
    wetWalls: [
      { id: 1, location: 'North wall - Kitchen/Bath', fixtureCount: 5 },
      { id: 2, location: 'East wall - Master suite', fixtureCount: 3 },
    ],
    redFlags: [
      { type: 'warning', message: 'Long vent run detected (>40 ft)', location: 'Master Bath' },
      { type: 'info', message: 'Wet wall grouping could save 12% on labor', location: 'Kitchen area' },
    ],
    laborEstimate: {
      hours: 48,
      confidence: 0.87,
      breakdown: [
        { phase: 'Rough-in', hours: 24 },
        { phase: 'Top-out', hours: 16 },
        { phase: 'Fixtures', hours: 8 },
      ],
    },
  };

  return (
    <div className="space-y-4 animate-fadeIn h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/blueprints')}>
            <ArrowLeftIcon className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-100">
                {blueprint.project_name || blueprint.file_name}
              </h1>
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              <Badge variant="default" className="flex items-center gap-1">
                <SparklesIcon className="w-3 h-3" />
                AI Studio
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {blueprint.status === 'completed' && (
            <Button
              variant="primary"
              onClick={handleGenerateBid}
              disabled={generateBidMutation.isPending}
            >
              <CurrencyDollarIcon className="w-5 h-5 mr-2" />
              {generateBidMutation.isPending ? 'Generating...' : 'Generate Estimate'}
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={() => setShowAIInsights(!showAIInsights)}
          >
            <SparklesIcon className="w-5 h-5 mr-2" />
            {showAIInsights ? 'Hide' : 'Show'} AI Insights
          </Button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 overflow-hidden">
        {/* Blueprint Canvas - Takes 3 columns */}
        <div className="lg:col-span-3">
          <BlueprintCanvas
            imageUrl={blueprintsApi.fileUrl(blueprint.file_path)}
            width={1200}
            height={800}
            fixtures={blueprint.analysis_data?.fixtures || []}
          />
        </div>

        {/* AI Insight Panel - Takes 1 column */}
        {showAIInsights && blueprint.status === 'completed' && (
          <div className="space-y-4 overflow-y-auto">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Analysis Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-blue-500/10 rounded-lg">
                    <p className="text-2xl font-bold text-blue-500">
                      {blueprint.analysis_data?.summary?.totalFixtures || 0}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Fixtures</p>
                  </div>
                  <div className="text-center p-3 bg-green-500/10 rounded-lg">
                    <p className="text-2xl font-bold text-green-500">
                      {blueprint.analysis_data?.summary?.totalRooms || 0}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Rooms</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Labor Estimate */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <ChartBarIcon className="w-4 h-4 text-purple-400" />
                  Labor Estimate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-bold text-purple-400">
                        {aiInsights.laborEstimate.hours}h
                      </p>
                      <p className="text-xs text-slate-400">
                        {(aiInsights.laborEstimate.confidence * 100).toFixed(0)}% confidence
                      </p>
                    </div>
                    <SparklesIcon className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="space-y-2">
                    {aiInsights.laborEstimate.breakdown.map((phase) => (
                      <div key={phase.phase} className="flex justify-between text-sm">
                        <span className="text-slate-400">{phase.phase}</span>
                        <span className="text-slate-200 font-medium">{phase.hours}h</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stack Detection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <WrenchScrewdriverIcon className="w-4 h-4 text-blue-400" />
                  Stack Detection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {aiInsights.stackDetection.map((stack, i) => (
                    <div key={i} className="p-2 bg-slate-800 rounded text-sm">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-slate-300 font-medium">{stack.floor}</span>
                        <Badge variant="blue">{stack.count} stacks</Badge>
                      </div>
                      <p className="text-xs text-slate-400">{stack.location}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Wet Wall Grouping */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Wet Wall Groups</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {aiInsights.wetWalls.map((wall) => (
                    <div key={wall.id} className="p-2 bg-slate-800 rounded text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300">{wall.location}</span>
                        <span className="text-xs text-green-400">{wall.fixtureCount} fixtures</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Red Flags & Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <ExclamationTriangleIcon className="w-4 h-4 text-yellow-400" />
                  AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {aiInsights.redFlags.map((flag, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded text-sm ${
                        flag.type === 'warning'
                          ? 'bg-yellow-500/10 border border-yellow-500/20'
                          : 'bg-blue-500/10 border border-blue-500/20'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {flag.type === 'warning' ? (
                          <ExclamationTriangleIcon className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircleIcon className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="text-slate-200">{flag.message}</p>
                          <p className="text-xs text-slate-400 mt-1">{flag.location}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Explain Mode */}
            <Card className="border-purple-500/30">
              <CardContent>
                <div className="text-center py-4">
                  <SparklesIcon className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-300 mb-3">
                    Click any fixture or area for AI explanation
                  </p>
                  <Button variant="secondary" size="sm">
                    Enable AI Explain Mode
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
