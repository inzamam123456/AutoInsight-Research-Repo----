import React, { useState, useEffect } from 'react';
import {
  Database,
  PlusCircle,
  BarChart3,
  Bot,
  History,
  FileText,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Layers,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { ProcessingJob, SavedReport } from '../../types';

export const OverviewView: React.FC = () => {
  const { datasets, setActiveView, setActiveDatasetId, user, openAuthModal } = useApp();
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsList, reportsList] = await Promise.all([
          api.listJobs(),
          api.listReports()
        ]);
        setJobs(jobsList);
        setReports(reportsList);
      } catch (err) {
        console.warn('Could not load overview stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalDatasets = datasets.length;
  const readyDatasets = datasets.filter(d => d.processingStatus === 'ready_for_analysis').length;
  const recentJobs = jobs.slice(0, 5);
  const failedJobs = jobs.filter(j => j.status === 'failed');

  const handleSelectDataset = (id: string, targetView: 'dataset_detail' | 'dashboards' | 'ai_analyst') => {
    setActiveDatasetId(id);
    setActiveView(targetView);
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Hero Welcome Banner */}
      <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-[#172554] via-[#1e3a8a] to-[#2563EB] text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-xs font-semibold text-teal-200 mb-3 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-teal-300" />
            <span>Autonomous Analytics & Verifiable Insights</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Hello, {user?.displayName || 'Analyst'}
          </h1>
          <p className="mt-2 text-sm md:text-base text-blue-100 leading-relaxed">
            Upload raw tabular data, automatically clean inconsistencies, generate executive dashboards, and query your numbers with deterministic, evidence-backed answers.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveView('new_analysis')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white text-[#172554] hover:bg-slate-100 text-xs font-bold shadow-sm transition-all"
            >
              <PlusCircle className="w-4 h-4 text-[#2563EB]" />
              <span>+ Start New Analysis</span>
            </button>
            {datasets.length > 0 && (
              <button
                onClick={() => handleSelectDataset(datasets[0].id, 'dashboards')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-700/60 hover:bg-blue-700/90 text-white text-xs font-semibold backdrop-blur-xs transition-all border border-white/15"
              >
                <BarChart3 className="w-4 h-4 text-teal-300" />
                <span>View Latest Dashboard</span>
              </button>
            )}
          </div>
        </div>

        {/* Decorative background geometry */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-96 h-96 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Datasets</span>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#2563EB]">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{totalDatasets}</span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {readyDatasets} validated & ready for analysis
            </p>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Dashboards</span>
            <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-[#0D9488]">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{readyDatasets}</span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Auto-generated interactive visual boards
            </p>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Completed Pipelines</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {jobs.filter(j => j.status === 'completed').length}
            </span>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>100% verified deterministic execution</span>
            </p>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Saved Reports</span>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{reports.length}</span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Executive summaries & snapshots
            </p>
          </div>
        </div>
      </div>

      {/* Failed jobs alert if any */}
      {failedJobs.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            <div>
              <p className="text-xs font-bold text-rose-900 dark:text-rose-200">
                {failedJobs.length} processing job requires attention
              </p>
              <p className="text-xs text-rose-700 dark:text-rose-300">
                Review the error details and restart processing.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveView('processing_history')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors"
          >
            Review Jobs
          </button>
        </div>
      )}

      {/* Main Content Grid: Recent Datasets + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Datasets (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-500" />
              <span>Your Active Datasets</span>
            </h2>
            <button
              onClick={() => setActiveView('datasets')}
              className="text-xs font-semibold text-[#2563EB] hover:underline flex items-center gap-1"
            >
              <span>View all ({datasets.length})</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {datasets.map(d => (
              <div
                key={d.id}
                className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 transition-all shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3
                      onClick={() => handleSelectDataset(d.id, 'dataset_detail')}
                      className="text-sm font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer truncate"
                    >
                      {d.name}
                    </h3>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      v{d.currentVersion} · {d.fileFormat.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                    {d.description || 'Uploaded dataset with automated cleaning and dashboard'}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>{d.rowCount.toLocaleString()} rows</span>
                    <span aria-hidden="true">·</span>
                    <span>{d.columnCount} columns</span>
                    <span aria-hidden="true">·</span>
                    <span className={`font-semibold capitalize ${
                      d.processingStatus === 'ready_for_analysis' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'
                    }`}>
                      {d.processingStatus.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleSelectDataset(d.id, 'dashboards')}
                    className="px-3 py-1.5 text-xs font-semibold bg-blue-50 text-[#2563EB] hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-400 rounded-lg transition-colors"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => handleSelectDataset(d.id, 'ai_analyst')}
                    className="px-3 py-1.5 text-xs font-semibold bg-teal-50 text-[#0D9488] hover:bg-teal-100 dark:bg-teal-950/60 dark:text-teal-400 rounded-lg transition-colors"
                  >
                    AI Analyst
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Processing Activity Stream (1 col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-4 h-4 text-teal-500" />
              <span>Recent Activity</span>
            </h2>
            <button
              onClick={() => setActiveView('processing_history')}
              className="text-xs font-semibold text-[#2563EB] hover:underline"
            >
              History
            </button>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5">
            {recentJobs.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">
                No recent background jobs recorded.
              </p>
            ) : (
              recentJobs.map(j => (
                <div key={j.id} className="text-xs space-y-1 pb-3 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                      {j.jobType} Pipeline
                    </span>
                    <span className={`text-[11px] font-bold ${
                      j.status === 'completed'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : j.status === 'failed'
                        ? 'text-rose-600'
                        : 'text-amber-600'
                    }`}>
                      {j.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {j.currentStage} · {j.durationMs ? `${j.durationMs}ms` : 'in progress'}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {new Date(j.startTime).toLocaleTimeString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
