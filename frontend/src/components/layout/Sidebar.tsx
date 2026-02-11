import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import {
  HomeIcon,
  DocumentTextIcon,
  CalculatorIcon,
  WrenchScrewdriverIcon,
  UserGroupIcon,
  DocumentDuplicateIcon,
  CalendarIcon,
  CubeIcon,
  Cog6ToothIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
  CalculatorIcon as CalculatorIconSolid,
  WrenchScrewdriverIcon as WrenchScrewdriverIconSolid,
} from '@heroicons/react/24/solid';
import { getShortcutDisplay } from '../../hooks/useKeyboard';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: string;
  badgeColor?: 'cyan' | 'orange' | 'green';
  isActive: boolean;
}

function NavItem({ to, icon, label, badge, badgeColor = 'cyan', isActive }: NavItemProps) {
  const badgeColors = {
    cyan: 'bg-cyan-400 text-slate-950',
    orange: 'bg-orange-500 text-white',
    green: 'bg-emerald-500 text-white',
  };

  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg cursor-pointer transition-all text-[13px] font-medium relative',
        isActive
          ? 'bg-cyan-500/10 text-cyan-400 font-semibold'
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
      )}
    >
      {isActive && (
        <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-cyan-400" />
      )}
      <span className="w-[18px] h-[18px] flex items-center justify-center flex-shrink-0">
        {icon}
      </span>
      <span>{label}</span>
      {badge && (
        <span
          className={cn(
            'ml-auto text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-full',
            badgeColors[badgeColor]
          )}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-bold uppercase tracking-[2px] text-slate-600 px-3.5 mb-2 mt-4">
      {children}
    </div>
  );
}

export default function Sidebar() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-slate-900/95 border-r border-slate-800 flex-col z-40">
        {/* Brand */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <svg viewBox="0 0 24 24" className="w-5 h-5" stroke="white" fill="none" strokeWidth="2">
              <path
                d="M3 7v4a1 1 0 001 1h3v7a1 1 0 001 1h2a1 1 0 001-1v-7h2v7a1 1 0 001 1h2a1 1 0 001-1v-7h3a1 1 0 001-1V7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M4 7l8-3 8 3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div className="font-extrabold text-[17px] tracking-tight text-slate-100">
              Plansite<span className="text-cyan-400">OS</span>
            </div>
            <div className="font-mono text-[9px] text-slate-600 uppercase tracking-[2px]">
              CTL Plumbing LLC
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          <SectionLabel>Main</SectionLabel>
          <NavItem
            to="/"
            icon={<HomeIcon className="w-[18px] h-[18px]" />}
            label="Dashboard"
            isActive={path === '/'}
          />
          <NavItem
            to="/analyzer"
            icon={<DocumentTextIcon className="w-[18px] h-[18px]" />}
            label="Blueprint Analyzer"
            badge="AI"
            badgeColor="cyan"
            isActive={path === '/analyzer'}
          />
          <NavItem
            to="/blueprints"
            icon={<DocumentDuplicateIcon className="w-[18px] h-[18px]" />}
            label="Blueprints"
            isActive={path === '/blueprints' || path.startsWith('/blueprints/')}
          />
          <NavItem
            to="/estimates"
            icon={<CalculatorIcon className="w-[18px] h-[18px]" />}
            label="Estimates"
            badge="12"
            badgeColor="orange"
            isActive={path === '/estimates'}
          />
          <NavItem
            to="/jobs"
            icon={<WrenchScrewdriverIcon className="w-[18px] h-[18px]" />}
            label="Active Jobs"
            badge="6"
            badgeColor="green"
            isActive={path === '/jobs'}
          />

          <SectionLabel>Tools</SectionLabel>
          <NavItem
            to="/analyzer"
            icon={<span className="text-sm">📏</span>}
            label="Measure Tool"
            isActive={false}
          />
          <NavItem
            to="/analyzer"
            icon={<span className="text-sm">🔍</span>}
            label="Fixture Detect"
            isActive={false}
          />
          <NavItem
            to="/estimates"
            icon={<span className="text-sm">📋</span>}
            label="Bid Builder"
            isActive={false}
          />
          <NavItem
            to="#"
            icon={<CubeIcon className="w-[18px] h-[18px]" />}
            label="Material Lists"
            isActive={false}
          />
          <NavItem
            to="#"
            icon={<span className="text-sm">🧮</span>}
            label="Pipe Calculator"
            isActive={false}
          />

          <SectionLabel>Business</SectionLabel>
          <NavItem
            to="/leads"
            icon={<UserGroupIcon className="w-[18px] h-[18px]" />}
            label="Customers"
            isActive={path === '/leads'}
          />
          <NavItem
            to="#"
            icon={<span className="text-sm">🧾</span>}
            label="Invoices"
            isActive={false}
          />
          <NavItem
            to="#"
            icon={<CalendarIcon className="w-[18px] h-[18px]" />}
            label="Schedule"
            isActive={false}
          />
          <NavItem
            to="/reports"
            icon={<ChartBarIcon className="w-[18px] h-[18px]" />}
            label="Reports"
            isActive={path === '/reports'}
          />
          <NavItem
            to="/messages"
            icon={<ChatBubbleLeftRightIcon className="w-[18px] h-[18px]" />}
            label="Messages"
            isActive={path === '/messages'}
          />
          <NavItem
            to="#"
            icon={<Cog6ToothIcon className="w-[18px] h-[18px]" />}
            label="Settings"
            isActive={false}
          />
        </nav>

        {/* Footer: AI Engine Status */}
        <div className="p-4 border-t border-slate-800">
          <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-lg px-3.5 py-3 flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 animate-pulse shadow-lg shadow-emerald-400/50" />
            <div className="font-mono text-[11px] leading-tight">
              <div className="font-bold text-emerald-400">Ollama AI Online</div>
              <div className="text-slate-500 text-[10px]">Llama 3.1 8B · 16GB RAM</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-3 px-1 space-y-1 text-xs text-slate-500">
            <div className="flex items-center justify-between">
              <span>Command Palette</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-semibold bg-slate-800 border border-slate-700 rounded">
                {getShortcutDisplay('mod+k')}
              </kbd>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Tab Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-40">
        <div className="grid grid-cols-5 h-16">
          {[
            { to: '/', icon: HomeIcon, label: 'Home' },
            { to: '/analyzer', icon: DocumentTextIcon, label: 'Analyzer' },
            { to: '/blueprints', icon: DocumentDuplicateIcon, label: 'Prints' },
            { to: '/estimates', icon: CalculatorIcon, label: 'Estimates' },
            { to: '/jobs', icon: WrenchScrewdriverIcon, label: 'Jobs' },
          ].map((tab) => {
            const isActive = path === tab.to;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={cn(
                  'flex flex-col items-center justify-center space-y-1 transition-colors',
                  isActive ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-300'
                )}
              >
                <Icon className="w-6 h-6" />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
