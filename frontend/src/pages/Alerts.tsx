import React from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAlertsStore } from '../stores/useAlertsStore';
import { formatRelativeTime, getAlertIcon } from '../lib/utils';
import * as Icons from 'lucide-react';

export function Alerts() {
  const { alerts, unreadCount, markAsRead, markAllAsRead } = useAlertsStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Alerts</h1>
          <p className="text-gray-600 mt-1">
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" onClick={markAllAsRead}>
            <CheckCheck className="w-5 h-5" />
            Mark All Read
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {alerts.length === 0 ? (
          <Card className="text-center py-16">
            <Bell className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No alerts</h3>
            <p className="text-gray-600">You're all caught up!</p>
          </Card>
        ) : (
          alerts.map((alert) => {
            const IconComponent = (Icons as any)[getAlertIcon(alert.type)] || Bell;

            return (
              <Card
                key={alert.id}
                className={alert.read ? 'opacity-60' : ''}
                hoverable
                onClick={() => !alert.read && markAsRead(alert.id)}
              >
                <div className="flex gap-4">
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      alert.severity === 'error'
                        ? 'bg-danger-100 text-danger-600'
                        : alert.severity === 'warning'
                        ? 'bg-warning-100 text-warning-600'
                        : alert.severity === 'success'
                        ? 'bg-success-100 text-success-600'
                        : 'bg-navy-100 text-navy-600'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <h4 className="font-semibold text-gray-900">{alert.title}</h4>
                      {!alert.read && (
                        <Badge variant="orange" size="sm" dot>
                          New
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        {formatRelativeTime(alert.createdAt)}
                      </p>
                      {alert.actionLabel && (
                        <Button variant="ghost" size="sm">
                          {alert.actionLabel}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
