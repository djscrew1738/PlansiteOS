import React from 'react';
import { Bot, Send } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export function Vlad() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Vlad AI Assistant</h1>
        <p className="text-gray-600 mt-1">Your intelligent plumbing assistant</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Area */}
        <Card className="lg:col-span-3 h-[600px] flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Welcome Message */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div className="flex-1 bg-gray-100 rounded-lg p-4">
                <p className="text-sm text-gray-900">
                  👋 Hi! I'm Vlad, your AI plumbing assistant. I can help you with:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-gray-700">
                  <li>• Analyzing blueprints and counting fixtures</li>
                  <li>• Estimating materials and labor costs</li>
                  <li>• Answering plumbing code questions</li>
                  <li>• Recommending best practices</li>
                  <li>• Troubleshooting installation issues</li>
                </ul>
                <p className="mt-3 text-sm text-gray-900">
                  What can I help you with today?
                </p>
              </div>
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex gap-3">
              <Input
                placeholder="Ask Vlad anything about plumbing..."
                className="flex-1"
              />
              <Button>
                <Send className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Powered by Claude Sonnet 4 • Always verify critical information
            </p>
          </div>
        </Card>

        {/* Sidebar */}
        <Card className="lg:col-span-1">
          <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Button variant="outline" size="sm" fullWidth>
              Analyze Blueprint
            </Button>
            <Button variant="outline" size="sm" fullWidth>
              Calculate Estimate
            </Button>
            <Button variant="outline" size="sm" fullWidth>
              Code Question
            </Button>
            <Button variant="outline" size="sm" fullWidth>
              Material List
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">Recent Chats</h3>
            <p className="text-sm text-gray-500">No recent conversations</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
