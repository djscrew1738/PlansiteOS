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
    shortName: 'Home',
    path: '/',
    icon: LayoutDashboard,
    gradient: 'from-indigo-500 to-indigo-600',
    activeText: 'text-indigo-600',
  },
  {
    name: 'Messages',
    shortName: 'Messages',
    path: '/messages',
    icon: MessageSquare,
    gradient: 'from-teal-500 to-cyan-500',
    activeText: 'text-teal-600',
    badge: 3,
  },
  {
    name: 'Blueprints',
    shortName: 'Blueprints',
    path: '/blueprints',
    icon: FileImage,
    gradient: 'from-blue-500 to-blue-600',
    activeText: 'text-blue-600',
  },
  {
    name: 'Estimates',
    shortName: 'Estimates',
    path: '/estimates',
    icon: Calculator,
    gradient: 'from-emerald-500 to-green-500',
    activeText: 'text-emerald-600',
  },
  {
    name: 'Material',
    shortName: 'Material',
    path: '/material',
    icon: Package,
    gradient: 'from-amber-500 to-orange-500',
    activeText: 'text-amber-600',
  },
];

export default function MobileBottomNav() {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200/50 sm:hidden z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.path);

          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={`relative flex flex-col items-center justify-center flex-1 py-2 transition-all ${
                active ? tab.activeText : 'text-gray-400'
              }`}
            >
              <div className={`relative p-2 rounded-xl transition-all ${
                active
                  ? `bg-gradient-to-r ${tab.gradient} shadow-lg`
                  : ''
              }`}>
                <Icon className={`w-5 h-5 ${active ? 'text-white' : ''}`} />

                {/* Notification Badge */}
                {tab.badge && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] font-bold min-w-[16px] h-[16px] flex items-center justify-center rounded-full animate-badge-pulse">
                    {tab.badge}
                  </span>
                )}
              </div>

              <span className={`text-[10px] mt-1 font-medium ${active ? '' : 'text-gray-500'}`}>
                {tab.shortName}
              </span>

              {/* Active Indicator */}
              {active && (
                <span className={`absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-gradient-to-r ${tab.gradient} rounded-b-full`} />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
