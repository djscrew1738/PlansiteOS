import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Users,
  FileCheck,
  BarChart3,
  Settings,
  Menu,
  X,
  ChevronDown,
  LogOut,
  UserCircle,
  HardHat, // New icon for trade-specific context
} from 'lucide-react';
import { useState, Fragment } from 'react';
import { Transition, Menu as HeadlessMenu } from '@headlessui/react'; // Using Headless UI for accessible dropdowns

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Blueprints', href: '/blueprints', icon: FileText },
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
    <div className="min-h-screen bg-gray-50 font-sans antialiased">
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/80 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 flex-shrink-0 bg-gray-900">
          <Link to="/" className="flex items-center">
            <HardHat className="w-8 h-8 text-primary-500" />
            <span className="ml-2 text-xl font-extrabold tracking-tight text-white">PlansiteOS</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white p-2 rounded-md"
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
                    ? 'bg-primary-700 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors'
                )}
              >
                <item.icon
                  className={classNames(
                    isActive ? 'text-white' : 'text-gray-400 group-hover:text-white',
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
        <div className="border-t border-gray-700 p-4 flex-shrink-0">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserCircle className="h-9 w-9 text-gray-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">CTL Plumbing</p>
              <p className="text-xs text-gray-400">Owner</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="lg:pl-64 flex flex-col">
        {/* Top bar */}
        <div className="sticky top-0 z-30 flex-shrink-0 flex h-16 bg-white shadow-sm border-b border-gray-200">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1 flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">{currentPage}</h1>
            </div>
            <div className="ml-4 flex items-center lg:ml-6">
              {/* Profile dropdown */}
              <HeadlessMenu as="div" className="ml-3 relative">
                <div>
                  <HeadlessMenu.Button className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 lg:p-2 lg:rounded-md lg:hover:bg-gray-100">
                    <span className="hidden ml-3 text-gray-700 text-sm font-medium lg:block">
                      <span className="sr-only">Open user menu for </span>CTL Plumbing
                    </span>
                    <ChevronDown
                      className="hidden flex-shrink-0 ml-1 h-5 w-5 text-gray-400 lg:block"
                      aria-hidden="true"
                    />
                  </HeadlessMenu.Button>
                </div>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <HeadlessMenu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <HeadlessMenu.Item>
                      {({ active }) => (
                        <Link
                          to="/profile"
                          className={classNames(
                            active ? 'bg-gray-100' : '',
                            'block px-4 py-2 text-sm text-gray-700'
                          )}
                        >
                          <UserCircle className="inline-block w-4 h-4 mr-2" />
                          Your Profile
                        </Link>
                      )}
                    </HeadlessMenu.Item>
                    <HeadlessMenu.Item>
                      {({ active }) => (
                        <Link
                          to="/settings"
                          className={classNames(
                            active ? 'bg-gray-100' : '',
                            'block px-4 py-2 text-sm text-gray-700'
                          )}
                        >
                          <Settings className="inline-block w-4 h-4 mr-2" />
                          Settings
                        </Link>
                      )}
                    </HeadlessMenu.Item>
                    <HeadlessMenu.Item>
                      {({ active }) => (
                        <Link
                          to="/signout"
                          className={classNames(
                            active ? 'bg-gray-100' : '',
                            'block px-4 py-2 text-sm text-gray-700'
                          )}
                        >
                          <LogOut className="inline-block w-4 h-4 mr-2" />
                          Sign out
                        </Link>
                      )}
                    </HeadlessMenu.Item>
                  </HeadlessMenu.Items>
                </Transition>
              </HeadlessMenu>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
