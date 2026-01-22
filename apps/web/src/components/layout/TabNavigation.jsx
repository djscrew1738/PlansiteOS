import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  FileImage,
  Calculator,
  Package
} from 'lucide-react';

const tabs = [
  {
    name: 'Dashboard',
    path: '/',
    icon: LayoutDashboard,
    gradient: 'from-indigo-500 to-indigo-600',
    activeText: 'text-indigo-600',
    activeBg: 'bg-indigo-50',
  },
  {
    name: 'Messages',
    path: '/messages',
    icon: MessageSquare,
    gradient: 'from-teal-500 to-cyan-500',
    activeText: 'text-teal-600',
    activeBg: 'bg-teal-50',
    badge: 3, // Notification count - can be made dynamic
  },
  {
    name: 'Blueprints',
    path: '/blueprints',
    icon: FileImage,
    gradient: 'from-blue-500 to-blue-600',
    activeText: 'text-blue-600',
    activeBg: 'bg-blue-50',
  },
  {
    name: 'Estimates',
    path: '/estimates',
    icon: Calculator,
    gradient: 'from-emerald-500 to-green-500',
    activeText: 'text-emerald-600',
    activeBg: 'bg-emerald-50',
  },
  {
    name: 'Material',
    path: '/material',
    icon: Package,
    gradient: 'from-amber-500 to-orange-500',
    activeText: 'text-amber-600',
    activeBg: 'bg-amber-50',
  },
];

export default function TabNavigation({ mobile = false, onNavigate }) {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  if (mobile) {
    return (
      <nav className="space-y-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.path);

          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              onClick={onNavigate}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                active
                  ? `${tab.activeBg} ${tab.activeText}`
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className={`p-2 rounded-lg ${active ? `bg-gradient-to-r ${tab.gradient}` : 'bg-gray-100'}`}>
                <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-500'}`} />
              </div>
              <span className="font-medium">{tab.name}</span>
              {tab.badge && (
                <span className="ml-auto bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-badge-pulse">
                  {tab.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="flex items-center justify-center space-x-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = isActive(tab.path);

        return (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={`tab group relative flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
              active
                ? `tab-active ${tab.activeBg} ${tab.activeText}`
                : 'tab-inactive text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className={`p-1.5 rounded-lg transition-all ${
              active
                ? `bg-gradient-to-r ${tab.gradient} shadow-lg`
                : 'bg-gray-100 group-hover:bg-gray-200'
            }`}>
              <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-gray-500 group-hover:text-gray-600'}`} />
            </div>
            <span className="hidden xl:inline">{tab.name}</span>

            {/* Notification Badge */}
            {tab.badge && (
              <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full animate-badge-pulse shadow-lg shadow-red-500/30">
                {tab.badge}
              </span>
            )}

            {/* Active Indicator */}
            {active && (
              <span className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-gradient-to-r ${tab.gradient} rounded-full`} />
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
