import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Users,
  FileCheck,
  BarChart3,
  Settings,
  Sparkles,
  Menu,
  X,
  ChevronDown,
  UserCircle,
  HardHat, // New icon for trade-specific context
} from 'lucide-react';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Blueprints', href: '/blueprints', icon: FileText },
  { name: 'Takeoff', href: '/takeoff', icon: Sparkles },
  { name: 'Leads', href: '/leads', icon: Users },
  { name: 'Bids', href: '/bids', icon: FileCheck },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const currentPage = navigation.find(item => item.href === location.pathname)?.name || 'Dashboard';

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-darker via-surface-dark to-slate-950 text-text-primary font-sans antialiased">
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-surface-darker/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-surface-darker/95 text-text-primary border-r border-border/80 shadow-card transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 flex-shrink-0 bg-surface-darker border-b border-border/80">
          <Link to="/" className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 shadow-glow">
              <HardHat className="w-6 h-6 text-white" />
            </div>
            <span className="ml-3 text-xl font-extrabold tracking-tight text-text-primary">
              PlansiteOS
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-text-secondary hover:text-text-primary p-2 rounded-md"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navigation.map(item => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={classNames(
                  isActive
                    ? 'bg-primary-600/30 text-text-primary border border-primary-500/40 shadow-glow'
                    : 'text-text-secondary hover:bg-surface-hover/80 hover:text-text-primary border border-transparent',
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-xl transition-colors'
                )}
              >
                <item.icon
                  className={classNames(
                    isActive ? 'text-primary-200' : 'text-text-tertiary group-hover:text-text-primary',
                    'mr-3 flex-shrink-0 h-6 w-6'
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User profile section */}
        <div className="border-t border-border/80 p-4 flex-shrink-0">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserCircle className="h-9 w-9 text-text-tertiary" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-semibold text-text-primary">CTL Plumbing</p>
              <p className="text-xs text-text-tertiary">Owner</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="lg:pl-64 flex flex-col">
        {/* Top bar */}
        <div className="sticky top-0 z-30 flex-shrink-0 flex h-16 bg-surface-darker/80 backdrop-blur border-b border-border/80 shadow-soft">
          <button
            type="button"
            className="px-4 border-r border-border/80 text-text-secondary focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500/60 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1 flex items-center">
              <h1 className="text-2xl font-bold text-text-primary">{currentPage}</h1>
            </div>
            <div className="ml-4 flex items-center lg:ml-6">
              <button
                type="button"
                className="max-w-xs bg-surface flex items-center text-sm rounded-full border border-border/80 focus:outline-none focus:ring-2 focus:ring-primary-500/60 focus:ring-offset-0 lg:p-2 lg:rounded-xl lg:hover:bg-surface-hover"
              >
                <span className="hidden ml-3 text-text-secondary text-sm font-medium lg:block">
                  <span className="sr-only">User profile</span>CTL Plumbing
                </span>
                <ChevronDown
                  className="hidden flex-shrink-0 ml-1 h-5 w-5 text-text-tertiary lg:block"
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-hero-glow">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
