import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  DocumentTextIcon,
  CalculatorIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
  CalculatorIcon as CalculatorIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconSolid,
  ChartBarIcon as ChartBarIconSolid,
} from '@heroicons/react/24/solid';
import { getShortcutDisplay } from '../../hooks/useKeyboard';

const tabs = [
  { path: '/', label: 'Dashboard', icon: HomeIcon, iconSolid: HomeIconSolid },
  { path: '/blueprints', label: 'Blueprints', icon: DocumentTextIcon, iconSolid: DocumentTextIconSolid },
  { path: '/estimates', label: 'Estimates', icon: CalculatorIcon, iconSolid: CalculatorIconSolid },
  { path: '/leads', label: 'Leads', icon: UserGroupIcon, iconSolid: UserGroupIconSolid },
  { path: '/reports', label: 'Reports', icon: ChartBarIcon, iconSolid: ChartBarIconSolid },
  { path: '/messages', label: 'Messages', icon: ChatBubbleLeftRightIcon, iconSolid: ChatBubbleLeftRightIconSolid },
];

export default function TabBar() {
  const location = useLocation();

  return (
    <>
      {/* ── Mobile Bottom Tab Bar ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass glass-border border-t border-slate-800/60">
        <div className="grid grid-cols-6 h-16">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path ||
              (tab.path !== '/' && location.pathname.startsWith(tab.path));
            const Icon = isActive ? tab.iconSolid : tab.icon;

            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={`relative flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  isActive ? 'text-blue-400' : 'text-slate-500 active:text-slate-300'
                }`}
              >
                {/* Active indicator dot */}
                {isActive && (
                  <span className="absolute top-1.5 h-1 w-1 rounded-full bg-blue-400" />
                )}
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium leading-none mt-0.5">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[17rem] flex-col z-40 border-r border-slate-800/60 bg-slate-950/80 backdrop-blur-xl">
        {/* Brand */}
        <div className="px-6 pt-7 pb-6">
          <div className="flex items-center gap-3">
            {/* Logo mark */}
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/20">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-50">PlansiteOS</h1>
              <p className="text-[11px] font-medium text-slate-500 tracking-wide uppercase">Plumbing Estimator</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-5 h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />

        {/* Navigation */}
        <nav className="flex-1 px-4 py-5 space-y-1 overflow-y-auto">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path ||
              (tab.path !== '/' && location.pathname.startsWith(tab.path));
            const Icon = isActive ? tab.iconSolid : tab.icon;

            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-500/10 text-blue-400'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                {/* Active bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                )}
                <Icon className={`h-[18px] w-[18px] transition-colors ${
                  isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'
                }`} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="mx-5 h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />

        {/* Bottom Section */}
        <div className="p-4 space-y-3">
          {/* Keyboard Shortcuts Hint */}
          <div className="rounded-xl bg-slate-900/60 border border-slate-800/60 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2.5">Quick Actions</p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Command Palette</span>
                <kbd className="inline-flex h-5 items-center rounded border border-slate-700 bg-slate-800 px-1.5 font-mono text-[10px] font-semibold text-slate-400">
                  {getShortcutDisplay('mod+k')}
                </kbd>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Shortcuts Help</span>
                <kbd className="inline-flex h-5 items-center rounded border border-slate-700 bg-slate-800 px-1.5 font-mono text-[10px] font-semibold text-slate-400">
                  ?
                </kbd>
              </div>
            </div>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-slate-900/60 cursor-pointer">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 text-xs font-bold text-slate-200 ring-1 ring-slate-700/60">
              CT
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">CTL Plumbing</p>
              <p className="text-[11px] text-slate-500 truncate">Admin</p>
            </div>
            <svg className="h-4 w-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
            </svg>
          </div>
        </div>
      </aside>
    </>
  );
}
