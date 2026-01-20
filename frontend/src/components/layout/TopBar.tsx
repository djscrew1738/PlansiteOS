import React from 'react';
import { Menu, Bell, User, LogOut } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { useUserStore } from '../../stores/useUserStore';
import { useAlertsStore } from '../../stores/useAlertsStore';
import { cn, getInitials } from '../../lib/utils';

export function TopBar() {
  const { sidebarOpen, toggleMobileNav } = useUIStore();
  const { user, logout } = useUserStore();
  const { unreadCount } = useAlertsStore();

  return (
    <header
      className={cn(
        'fixed top-0 right-0 h-16 bg-white border-b border-gray-200 z-20 transition-all duration-300',
        sidebarOpen ? 'lg:left-64' : 'lg:left-20',
        'left-0'
      )}
    >
      <div className="h-full px-4 flex items-center justify-between">
        {/* Left: Mobile menu + Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleMobileNav}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 hidden sm:block">
            Welcome back, {user?.name?.split(' ')[0] || 'User'}
          </h1>
        </div>

        {/* Right: Notifications + User Menu */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5 text-gray-700" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />
            )}
          </button>

          {/* User Menu */}
          <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.role}</p>
            </div>
            <div className="w-9 h-9 bg-navy-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                getInitials(user?.name || 'User')
              )}
            </div>
            <button
              onClick={logout}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4 text-gray-700" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
