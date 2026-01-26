/**
 * Command Center Dashboard
 * Live, actionable dashboard optimized for contractors
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  HomeIcon,
  DocumentTextIcon,
  ChartBarIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  BellAlertIcon,
} from '@heroicons/react/24/outline';

interface WorkQueueItem {
  id: string;
  title: string;
  type: 'inspection' | 'estimate' | 'topout' | 'follow-up';
  priority: 'high' | 'medium' | 'low';
  effort: string;
  deadline?: string;
  action: string;
  risk?: string;
}

interface AIInsight {
  id: string;
  type: 'pricing' | 'efficiency' | 'trend';
  message: string;
  impact: string;
}

export default function CommandCenter() {
  const navigate = useNavigate();
  const [timeframe, setTimeframe] = useState<'week' | 'month'>('week');

  // Today's critical items (would come from API)
  const todayStats = {
    inspections: [
      { id: 1, name: 'Oak Ridge Ln #23', time: '10:00 AM', status: 'scheduled' },
      { id: 2, name: 'Maple Dr #45', time: '2:30 PM', status: 'scheduled' },
    ],
    activeHouses: [
      { id: 1, name: 'Willow Creek', stage: 'rough-in', progress: 75 },
      { id: 2, name: 'Sunset Hills', stage: 'top-out', progress: 45 },
      { id: 3, name: 'Pine Valley', stage: 'fixtures', progress: 90 },
    ],
    pendingEstimates: [
      { id: 1, name: 'Builder X - Lot 12', amount: 15400, age: 2 },
      { id: 2, name: 'Builder Y - Lot 8', amount: 22100, age: 5 },
    ],
    cashFlow: {
      week: 45200,
      month: 182400,
      trend: 12, // %
    },
  };

  // Smart work queue (prioritized by rules)
  const workQueue: WorkQueueItem[] = [
    {
      id: '1',
      title: 'Oak Ridge Ln #23 - Inspection',
      type: 'inspection',
      priority: 'high',
      effort: '1-2 hours',
      deadline: 'Today, 10:00 AM',
      action: 'Prepare for rough-in inspection',
      risk: 'Deadline in 2 hours',
    },
    {
      id: '2',
      title: 'Builder X - Lot 12 Estimate',
      type: 'estimate',
      priority: 'high',
      effort: '30 min',
      deadline: '2 days overdue',
      action: 'Send final pricing',
      risk: 'Builder SLA at risk',
    },
    {
      id: '3',
      title: 'Sunset Hills - Top-out',
      type: 'topout',
      priority: 'medium',
      effort: '4-6 hours',
      deadline: 'Tomorrow',
      action: 'Complete top-out plumbing',
    },
    {
      id: '4',
      title: 'Willow Creek - Follow-up',
      type: 'follow-up',
      priority: 'medium',
      effort: '15 min',
      action: 'Check fixture delivery status',
    },
    {
      id: '5',
      title: 'Pine Valley - Final walk',
      type: 'inspection',
      priority: 'low',
      effort: '1 hour',
      deadline: 'This week',
      action: 'Schedule final inspection',
    },
  ];

  // AI Insights
  const aiInsights: AIInsight[] = [
    {
      id: '1',
      type: 'pricing',
      message: "You're underpricing 3-story homes by ~8%",
      impact: 'Potential $12k/year revenue gain',
    },
    {
      id: '2',
      type: 'efficiency',
      message: 'Top-outs average +12% longer on slab jobs',
      impact: 'Consider +2hr buffer on estimates',
    },
    {
      id: '3',
      type: 'trend',
      message: 'Builder X has a 2-day approval lag',
      impact: 'Follow up earlier to maintain SLA',
    },
  ];

  const priorityColors = {
    high: 'red',
    medium: 'yellow',
    low: 'blue',
  } as const;

  const typeIcons = {
    inspection: CheckCircleIcon,
    estimate: DocumentTextIcon,
    topout: HomeIcon,
    'follow-up': BellAlertIcon,
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Command Center</h1>
          <p className="text-slate-400 mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={timeframe === 'week' ? 'primary' : 'ghost'}
            onClick={() => setTimeframe('week')}
          >
            Week
          </Button>
          <Button
            variant={timeframe === 'month' ? 'primary' : 'ghost'}
            onClick={() => setTimeframe('month')}
          >
            Month
          </Button>
        </div>
      </div>

      {/* Top Strip - Critical Today */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Inspections */}
        <Card className="cursor-pointer hover:border-blue-500/50 transition-colors" onClick={() => navigate('/dashboard')}>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Today's Inspections</p>
                <p className="text-3xl font-bold text-blue-500 mt-1">{todayStats.inspections.length}</p>
              </div>
              <CheckCircleIcon className="w-10 h-10 text-blue-400/30" />
            </div>
            <div className="mt-3 space-y-1">
              {todayStats.inspections.map(insp => (
                <div key={insp.id} className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 truncate">{insp.name}</span>
                  <Badge variant="blue">{insp.time}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active Houses */}
        <Card className="cursor-pointer hover:border-green-500/50 transition-colors" onClick={() => navigate('/blueprints')}>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Active Houses</p>
                <p className="text-3xl font-bold text-green-500 mt-1">{todayStats.activeHouses.length}</p>
              </div>
              <HomeIcon className="w-10 h-10 text-green-400/30" />
            </div>
            <div className="mt-3 space-y-2">
              {todayStats.activeHouses.map(house => (
                <div key={house.id}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-300 truncate">{house.name}</span>
                    <span className="text-slate-400">{house.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${house.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Estimates */}
        <Card className="cursor-pointer hover:border-yellow-500/50 transition-colors" onClick={() => navigate('/estimates')}>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Pending Estimates</p>
                <p className="text-3xl font-bold text-yellow-500 mt-1">{todayStats.pendingEstimates.length}</p>
              </div>
              <DocumentTextIcon className="w-10 h-10 text-yellow-400/30" />
            </div>
            <div className="mt-3 space-y-1">
              {todayStats.pendingEstimates.map(est => (
                <div key={est.id} className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 truncate">{est.name}</span>
                  <Badge variant={est.age > 3 ? 'red' : 'yellow'}>{est.age}d</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Cash Flow */}
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">
                  Cash Flow ({timeframe === 'week' ? 'Week' : 'Month'})
                </p>
                <p className="text-3xl font-bold text-purple-500 mt-1">
                  ${(timeframe === 'week' ? todayStats.cashFlow.week : todayStats.cashFlow.month).toLocaleString()}
                </p>
              </div>
              <CurrencyDollarIcon className="w-10 h-10 text-purple-400/30" />
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
              <span className="text-green-500 font-medium">+{todayStats.cashFlow.trend}%</span>
              <span className="text-slate-400">vs last {timeframe}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle - Smart Work Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClockIcon className="w-5 h-5 text-blue-400" />
            Smart Work Queue
            <Badge variant="default" className="ml-2">Prioritized</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {workQueue.map((item) => {
              const Icon = typeIcons[item.type];
              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer hover:bg-slate-800/50 transition-colors ${
                    item.priority === 'high'
                      ? 'border-red-500/30 bg-red-500/5'
                      : item.priority === 'medium'
                      ? 'border-yellow-500/30 bg-yellow-500/5'
                      : 'border-blue-500/30 bg-blue-500/5'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded ${
                        item.priority === 'high' ? 'bg-red-500/20' : item.priority === 'medium' ? 'bg-yellow-500/20' : 'bg-blue-500/20'
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          item.priority === 'high' ? 'text-red-400' : item.priority === 'medium' ? 'text-yellow-400' : 'text-blue-400'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-slate-200 font-medium">{item.title}</h4>
                          <Badge variant={priorityColors[item.priority]} className="text-xs">
                            {item.priority.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-400">{item.action}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <ClockIcon className="w-3 h-3" />
                            {item.effort}
                          </span>
                          {item.deadline && (
                            <span className="flex items-center gap-1">
                              <ExclamationTriangleIcon className="w-3 h-3" />
                              {item.deadline}
                            </span>
                          )}
                        </div>
                        {item.risk && (
                          <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-300">
                            ⚠️ {item.risk}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="primary">
                      Start
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Bottom - AI Insight Feed */}
      <Card className="border-purple-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-purple-400" />
            AI Insights
            <Badge variant="default" className="ml-2">Live Analysis</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {aiInsights.map((insight) => (
              <div
                key={insight.id}
                className={`p-4 rounded-lg border ${
                  insight.type === 'pricing'
                    ? 'bg-blue-500/5 border-blue-500/30'
                    : insight.type === 'efficiency'
                    ? 'bg-green-500/5 border-green-500/30'
                    : 'bg-purple-500/5 border-purple-500/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded ${
                    insight.type === 'pricing'
                      ? 'bg-blue-500/20'
                      : insight.type === 'efficiency'
                      ? 'bg-green-500/20'
                      : 'bg-purple-500/20'
                  }`}>
                    {insight.type === 'pricing' && <CurrencyDollarIcon className="w-5 h-5 text-blue-400" />}
                    {insight.type === 'efficiency' && <ChartBarIcon className="w-5 h-5 text-green-400" />}
                    {insight.type === 'trend' && <ArrowTrendingUpIcon className="w-5 h-5 text-purple-400" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-200 font-medium">{insight.message}</p>
                    <p className="text-sm text-slate-400 mt-1">{insight.impact}</p>
                  </div>
                  <Button size="sm" variant="ghost">
                    Learn More
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
