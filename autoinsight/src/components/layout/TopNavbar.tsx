import React from 'react';
import {
  Search,
  Sun,
  Moon,
  Activity,
  CheckCircle2,
  AlertCircle,
  Database,
  ArrowRight,
  LogOut,
  KeyRound
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const TopNavbar: React.FC = () => {
  const {
    activeView,
    setActiveView,
    user,
    logout,
    openAuthModal,
    datasets,
    activeDatasetId,
    setActiveDatasetId,
    isProcessing,
    activeJob,
    theme,
    toggleTheme,
    searchTerm,
    setSearchTerm
  } = useApp();

  const getBreadcrumbTitle = () => {
    switch (activeView) {
      case 'overview': return 'Overview';
      case 'new_analysis': return 'New Analysis & Dataset Upload';
      case 'datasets': return 'My Datasets';
      case 'dataset_detail': return 'Dataset Workspace';
      case 'dashboards': return 'Interactive Dashboards';
      case 'ai_analyst': return 'AI Data Analyst';
      case 'processing_history': return 'Processing History & Job Monitor';
      case 'saved_reports': return 'Saved Executive Reports';
      case 'help': return 'Help & Documentation';
      case 'settings': return 'System Settings';
      case 'profile': return 'User Profile';
      default: return 'AutoInsight';
    }
  };

  return (
    <header className="h-16 px-6 flex items-center justify-between border-b bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shrink-0">
      {/* Breadcrumb / Page Title */}
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold text-slate-900 dark:text-white">
          {getBreadcrumbTitle()}
        </h1>

        {/* Dataset switcher dropdown if viewing analysis/dashboard/dataset view */}
        {datasets.length > 0 && ['dataset_detail', 'dashboards', 'ai_analyst'].includes(activeView) && (
          <div className="hidden sm:flex items-center gap-2 pl-3 ml-3 border-l border-slate-200 dark:border-slate-700">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={activeDatasetId || ''}
              onChange={(e) => setActiveDatasetId(e.target.value)}
              className="text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-md px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {datasets.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} (v{d.currentVersion})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Center Search Bar & Realtime Results Dropdown */}
      <div className="hidden md:flex items-center flex-1 max-w-lg mx-6 relative">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-blue-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search datasets, metrics, charts, views, or ask AI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setSearchTerm('');
            }}
            className="w-full pl-9 pr-9 py-1.5 text-xs bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-blue-900/40 focus:border-blue-500 dark:focus:border-blue-400 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-[#0B132B] transition-all shadow-xs"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs px-1"
            >
              ×
            </button>
          )}
        </div>

        {/* Live Search Results Popover */}
        {searchTerm.trim().length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-blue-900/60 rounded-xl shadow-2xl overflow-hidden z-50 divide-y divide-slate-100 dark:divide-slate-800/80 max-h-[460px] overflow-y-auto">
            {/* Header / Query indicator */}
            <div className="p-2.5 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span className="font-medium">
                Search results for <span className="text-blue-600 dark:text-blue-400 font-bold">"{searchTerm}"</span>
              </span>
              <span className="text-[10px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded">Press Esc to dismiss</span>
            </div>

            {/* Quick Action: Ask AI Data Analyst directly */}
            <div className="p-2">
              <button
                onClick={() => {
                  setActiveView('ai_analyst');
                  // We don't clear searchTerm right away so AI analyst can pick it up
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-lg bg-blue-50/70 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-left transition-colors cursor-pointer group"
              >
                <div className="p-1.5 rounded-md bg-blue-600 text-white shrink-0 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
                      Ask AI Data Analyst
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-200/60 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 font-semibold">
                      Instant Query
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
                    "Analyze {searchTerm} across active dataset records"
                  </p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-blue-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>

            {/* Matching Datasets */}
            {(() => {
              const term = searchTerm.toLowerCase();
              const matchedDatasets = datasets.filter(d =>
                d.name.toLowerCase().includes(term) ||
                d.description.toLowerCase().includes(term) ||
                d.fileFormat.toLowerCase().includes(term)
              );

              if (matchedDatasets.length === 0) return null;

              return (
                <div className="p-2 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 py-0.5 block">
                    Datasets ({matchedDatasets.length})
                  </span>
                  {matchedDatasets.map(d => (
                    <button
                      key={d.id}
                      onClick={() => {
                        setActiveDatasetId(d.id);
                        setActiveView('dashboards');
                        setSearchTerm('');
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/70 text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Database className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                            {d.name}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {d.rowCount} records • {d.columnCount} columns • {d.fileFormat.toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium shrink-0 ml-2">
                        Open Dashboard →
                      </span>
                    </button>
                  ))}
                </div>
              );
            })()}

            {/* Matching App Views & Sections */}
            {(() => {
              const term = searchTerm.toLowerCase();
              const allViews: { view: any; label: string; desc: string }[] = [
                { view: 'overview', label: 'Executive Overview', desc: 'KPI summaries, recent activity, system health' },
                { view: 'new_analysis', label: 'New Analysis & Upload', desc: 'Upload PDF, CSV, Excel or JSON datasets' },
                { view: 'dashboards', label: 'Interactive Dashboards', desc: 'Tableau/PowerBI single-frame cross-filtering' },
                { view: 'ai_analyst', label: 'AI Data Analyst', desc: 'Natural language questions with mathematical proof' },
                { view: 'processing_history', label: 'Processing History & Jobs', desc: 'Job monitor, transformation logs, audit trail' },
                { view: 'saved_reports', label: 'Saved Executive Reports', desc: 'Archived snapshot reports and exports' },
                { view: 'settings', label: 'System Settings', desc: 'Appearance, density, retention, formats' }
              ];

              const matchedViews = allViews.filter(v =>
                v.label.toLowerCase().includes(term) || v.desc.toLowerCase().includes(term)
              );

              if (matchedViews.length === 0) return null;

              return (
                <div className="p-2 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 py-0.5 block">
                    Navigation & Views ({matchedViews.length})
                  </span>
                  {matchedViews.map(v => (
                    <button
                      key={v.view}
                      onClick={() => {
                        setActiveView(v.view);
                        setSearchTerm('');
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/70 text-left transition-colors cursor-pointer"
                    >
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {v.label}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {v.desc}
                        </p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  ))}
                </div>
              );
            })()}

            {/* Matching Analysis History */}
            {(() => {
              const term = searchTerm.toLowerCase();
              const matchedHistory = history.filter(h =>
                h.datasetName.toLowerCase().includes(term) ||
                (h.queryPrompt && h.queryPrompt.toLowerCase().includes(term)) ||
                (h.summary && h.summary.toLowerCase().includes(term))
              );

              if (matchedHistory.length === 0) return null;

              return (
                <div className="p-2 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 py-0.5 block">
                    Analysis History ({matchedHistory.length})
                  </span>
                  {matchedHistory.slice(0, 3).map(h => (
                    <button
                      key={h.id}
                      onClick={() => {
                        if (h.datasetId) setActiveDatasetId(h.datasetId);
                        setActiveView('processing_history');
                        setSearchTerm('');
                      }}
                      className="w-full p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/70 text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {h.datasetName}
                        </span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                          {h.qualityScore}% Quality
                        </span>
                      </div>
                      {h.queryPrompt && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          "{h.queryPrompt}"
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2.5">
        {/* Processing Indicator Button */}
        <button
          onClick={() => setActiveView('processing_history')}
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            isProcessing
              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 ring-1 ring-amber-400/30 animate-pulse'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Processing Status & Job Monitor"
        >
          {isProcessing ? (
            <>
              <Activity className="w-3.5 h-3.5 text-amber-500 animate-spin" />
              <span className="hidden sm:inline">{activeJob?.currentStage || 'Processing Data...'}</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden sm:inline">Engine Ready</span>
            </>
          )}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
        </button>

        {/* User Button & Sign Out */}
        {user ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveView('profile')}
              className="flex items-center gap-2 p-1.5 pl-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="View Profile & Preferences"
            >
              <div className="flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 hidden sm:inline leading-tight">
                  {user.displayName}
                </span>
                <span className="text-[10px] text-slate-400 hidden sm:inline leading-tight truncate max-w-[120px]">
                  {user.email}
                </span>
              </div>
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shadow-xs">
                {user.displayName ? user.displayName.slice(0, 1).toUpperCase() : 'U'}
              </div>
            </button>

            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => openAuthModal('otp')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs cursor-pointer transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Sign In (Email OTP)</span>
          </button>
        )}
      </div>
    </header>
  );
};
