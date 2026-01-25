import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  DocumentTextIcon,
  CalculatorIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
  CalculatorIcon as CalculatorIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconSolid,
  ChartBarIcon as ChartBarIconSolid
} from '@heroicons/react/24/solid';
import { getShortcutDisplay } from '../../hooks/useKeyboard';

const tabs = [
  { path: '/', label: 'Dashboard', icon: HomeIcon, iconSolid: HomeIconSolid },
  { path: '/blueprints', label: 'Blueprints', icon: DocumentTextIcon, iconSolid: DocumentTextIconSolid },
  { path: '/estimates', label: 'Estimates', icon: CalculatorIcon, iconSolid: CalculatorIconSolid },
  { path: '/leads', label: 'Leads', icon: UserGroupIcon, iconSolid: UserGroupIconSolid },
  { path: '/reports', label: 'Reports', icon: ChartBarIcon, iconSolid: ChartBarIconSolid },
  { path: '/messages', label: 'Messages', icon: ChatBubbleLeftRightIcon, iconSolid: ChatBubbleLeftRightIconSolid }
];

export default function TabBar() {
  const location = useLocation();

  return (
    <>
      {/* Mobile Bottom Tab Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-40">
        <div className="grid grid-cols-6 h-16">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            const Icon = isActive ? tab.iconSolid : tab.icon;

            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
                  isActive ? 'text-blue-500' : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-medium">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-slate-900 border-r border-slate-800 flex-col z-40">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold text-slate-100">PlansiteOS</h1>
          <p className="text-xs text-slate-400 mt-1">Plumbing Estimator</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            const Icon = isActive ? tab.iconSolid : tab.icon;

            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-800 space-y-3">
          {/* Keyboard Shortcuts Hint */}
          <div className="px-4 py-2 rounded-lg bg-slate-800/50">
            <p className="text-xs text-slate-400 mb-2">Quick Actions</p>
            <div className="space-y-1 text-xs text-slate-500">
              <div className="flex items-center justify-between">
                <span>Command Palette</span>
                <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-slate-700 border border-slate-600 rounded">
                  {getShortcutDisplay('mod+k')}
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>Shortcuts Help</span>
                <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-slate-700 border border-slate-600 rounded">
                  ?
                </kbd>
              </div>
            </div>
          </div>

          {/* User Profile */}
          <div className="flex items-center space-x-3 px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-medium text-slate-200">
              CT
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">CTL Plumbing</p>
              <p className="text-xs text-slate-400 truncate">Admin</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
