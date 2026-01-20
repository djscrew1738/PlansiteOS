import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Bell,
  Bot,
  Settings,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useUIStore } from '../../stores/useUIStore';
import { useAlertsStore } from '../../stores/useAlertsStore';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  badge?: number;
}

export function Sidebar() {
  const location = useLocation();
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const { unreadCount } = useAlertsStore();

  const navItems: NavItem[] = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Jobs', path: '/jobs', icon: Briefcase },
    { name: 'Estimates', path: '/estimates', icon: FileText },
    { name: 'Alerts', path: '/alerts', icon: Bell, badge: unreadCount },
    { name: 'Vlad AI', path: '/vlad', icon: Bot },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-navy-900 text-white transition-all duration-300 z-30',
          sidebarOpen ? 'w-64' : 'w-20'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-navy-800">
          {sidebarOpen ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center font-bold">
                P
              </div>
              <span className="font-bold text-lg">PlansiteOS</span>
            </div>
          ) : (
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center font-bold mx-auto">
              P
            </div>
          )}
          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 hover:bg-navy-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                  isActive
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-300 hover:bg-navy-800 hover:text-white'
                )}
                title={!sidebarOpen ? item.name : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && (
                  <>
                    <span className="flex-1 font-medium">{item.name}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="px-2 py-0.5 text-xs font-bold bg-orange-500 text-white rounded-full">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Expand Button (when collapsed) */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="mx-3 mb-4 p-2.5 hover:bg-navy-800 rounded-lg transition-colors"
            title="Expand sidebar"
          >
            <ChevronLeft className="w-5 h-5 rotate-180" />
          </button>
        )}
      </aside>
    </>
  );
}
