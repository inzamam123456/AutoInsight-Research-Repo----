import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  Database,
  BarChart3,
  Bot,
  History,
  FileText,
  HelpCircle,
  Settings,
  User,
  ChevronLeft,
  ChevronRight,
  LogOut,
  KeyRound
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AppView } from '../../types';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggleCollapse }) => {
  const { activeView, setActiveView, user, logout, openAuthModal } = useApp();

  const navItems: { view: AppView; label: string; icon: React.FC<{ className?: string }> }[] = [
    { view: 'overview', label: 'Overview', icon: LayoutDashboard },
    { view: 'new_analysis', label: 'New Analysis', icon: PlusCircle },
    { view: 'datasets', label: 'My Datasets', icon: Database },
    { view: 'dashboards', label: 'Dashboards', icon: BarChart3 },
    { view: 'ai_analyst', label: 'AI Analyst', icon: Bot },
    { view: 'processing_history', label: 'Processing History', icon: History },
    { view: 'saved_reports', label: 'Saved Reports', icon: FileText },
    { view: 'help', label: 'Help and Documentation', icon: HelpCircle },
    { view: 'settings', label: 'Settings', icon: Settings },
    { view: 'profile', label: 'User Profile', icon: User }
  ];

  return (
    <aside
      className={`relative flex flex-col border-r transition-all duration-300 select-none bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 dark:border-slate-800">
        <div
          onClick={() => setActiveView('overview')}
          className="flex items-center gap-3 cursor-pointer group"
          title="AutoInsight"
        >
          {/* Distinctive Logo */}
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-[#172554] to-[#2563EB] text-white shadow-sm ring-1 ring-black/5 group-hover:scale-105 transition-transform">
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
              <circle cx="19" cy="9" r="1.5" fill="#0D9488" stroke="none" />
            </svg>
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                AutoInsight
                <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]" />
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-tight">
                Raw Data to Insights
              </span>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label="Toggle Sidebar"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Prominent Action Button: + New Analysis */}
      <div className="p-3">
        <button
          onClick={() => setActiveView('new_analysis')}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm ${
            activeView === 'new_analysis'
              ? 'bg-[#172554] text-white ring-2 ring-blue-500/20'
              : 'bg-[#2563EB] hover:bg-[#1d4ed8] text-white'
          }`}
          title="Start New Analysis"
        >
          <PlusCircle className="w-4 h-4 shrink-0" />
          {!collapsed && <span>+ New Analysis</span>}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => setActiveView(item.view)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-[#2563EB] dark:bg-blue-950/50 dark:text-blue-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#2563EB] dark:text-blue-400' : 'text-slate-400 dark:text-slate-400'}`} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* User Section Bottom */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
        {user ? (
          <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
            <div
              onClick={() => setActiveView('profile')}
              className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.displayName}
                  className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-slate-200 dark:ring-slate-700"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-semibold flex items-center justify-center text-xs shrink-0 shadow-xs">
                  {user?.displayName ? user.displayName.slice(0, 2).toUpperCase() : 'AI'}
                </div>
              )}
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {user?.displayName || 'Active User'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {user?.email || 'user@autoinsight.io'}
                  </p>
                </div>
              )}
            </div>
            {!collapsed && (
              <button
                onClick={logout}
                title="Sign out"
                className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={() => openAuthModal('otp')}
            className={`w-full flex items-center justify-center gap-2 p-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer ${
              collapsed ? 'px-2' : ''
            }`}
            title="Sign In (Email OTP)"
          >
            <KeyRound className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="truncate">Sign In (OTP)</span>}
          </button>
        )}
      </div>
    </aside>
  );
};
