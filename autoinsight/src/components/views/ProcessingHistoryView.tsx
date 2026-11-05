import React, { useState, useEffect } from 'react';
import {
  History,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Activity,
  Layers,
  Search,
  RefreshCw,
  Database,
  Trash2,
  ExternalLink,
  MessageSquare,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { ProcessingJob, AnalysisHistoryRecord } from '../../types';

export const ProcessingHistoryView: React.FC = () => {
  const { history, fetchHistory, deleteHistoryItem, setActiveDatasetId, setActiveView } = useApp();
  const [viewTab, setViewTab] = useState<'analysis_history' | 'pipeline_jobs'>('analysis_history');
  
  // Pipeline jobs state
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<ProcessingJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const fetchJobs = async () => {
    try {
      const data = await api.listJobs();
      setJobs(data);
      if (data.length > 0 && !selectedJob) {
        setSelectedJob(data[0]);
      }
    } catch (err) {
      console.warn('Error loading jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchHistory();
    const interval = setInterval(fetchJobs, 4000);
    return () => clearInterval(interval);
  }, [fetchHistory]);

  const filteredJobs = jobs.filter(j => {
    if (statusFilter !== 'all' && j.status !== statusFilter) return false;
    if (search) {
      const match =
        j.jobType.toLowerCase().includes(search.toLowerCase()) ||
        j.currentStage.toLowerCase().includes(search.toLowerCase()) ||
        j.id.toLowerCase().includes(search.toLowerCase());
      if (!match) return false;
    }
    return true;
  });

  const filteredHistory = history.filter(h => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      h.datasetName.toLowerCase().includes(term) ||
      (h.queryPrompt && h.queryPrompt.toLowerCase().includes(term)) ||
      (h.summary && h.summary.toLowerCase().includes(term))
    );
  });

  const handleOpenDashboard = (datasetId?: string) => {
    if (datasetId) {
      setActiveDatasetId(datasetId);
      setActiveView('dashboards');
    }
  };

  const handleOpenAIAnalyst = (datasetId?: string) => {
    if (datasetId) {
      setActiveDatasetId(datasetId);
      setActiveView('ai_analyst');
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            <span>Analysis & Processing History</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Persistent database history of prompt queries, dataset analyses, and background transformation jobs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab Selector */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              onClick={() => setViewTab('analysis_history')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                viewTab === 'analysis_history'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Analysis History ({history.length})
            </button>
            <button
              onClick={() => setViewTab('pipeline_jobs')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                viewTab === 'pipeline_jobs'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Pipeline Jobs ({jobs.length})
            </button>
          </div>

          <button
            onClick={() => { fetchJobs(); fetchHistory(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* TAB 1: PERSISTENT ANALYSIS HISTORY */}
      {viewTab === 'analysis_history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search past analyses by dataset, prompt, or summary..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Database className="w-3.5 h-3.5 text-emerald-500" />
              <span>Database Storage Active</span>
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <History className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No past analysis history found
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Upload a dataset in New Analysis or query the AI Analyst to build your persistent analytical audit history.
              </p>
              <button
                onClick={() => setActiveView('new_analysis')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer"
              >
                Start New Analysis
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-400 dark:hover:border-blue-600 transition-all space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[200px]" title={item.datasetName}>
                          {item.datasetName}
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
                        {item.qualityScore}/100 Quality
                      </span>
                    </div>

                    {item.queryPrompt && (
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Prompt / Query</span>
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-0.5 line-clamp-2">
                          "{item.queryPrompt}"
                        </p>
                      </div>
                    )}

                    {item.summary && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                        {item.summary}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span className="text-[10px]">
                      {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    <div className="flex items-center gap-1">
                      {item.datasetId && (
                        <>
                          <button
                            onClick={() => handleOpenDashboard(item.datasetId)}
                            title="Open in Dashboard"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                          >
                            <BarChart3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenAIAnalyst(item.datasetId)}
                            title="Query in AI Analyst"
                            className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => deleteHistoryItem(item.id)}
                        title="Delete from database"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PIPELINE EXECUTION JOBS */}
      {viewTab === 'pipeline_jobs' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Jobs List (1 col) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search jobs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="running">Running</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                Loading job list...
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                No pipeline jobs matched the criteria.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredJobs.map(job => {
                  const isSelected = selectedJob?.id === job.id;
                  return (
                    <div
                      key={job.id}
                      onClick={() => setSelectedJob(job)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-50/50 border-blue-500 dark:bg-blue-950/30 dark:border-blue-600 shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {job.jobType.replace(/_/g, ' ').toUpperCase()}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            job.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : job.status === 'running'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 animate-pulse'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}
                        >
                          {job.status}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span>{job.currentStage}</span>
                        <span>{job.progressPercentage}%</span>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-1.5 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full transition-all duration-300"
                          style={{ width: `${job.progressPercentage}%` }}
                        />
                      </div>

                      <div className="mt-2 text-[10px] text-slate-400">
                        {new Date(job.startTime).toLocaleTimeString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Job Details & Logs (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            {selectedJob ? (
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white">
                        Job: {selectedJob.id}
                      </h2>
                      <span className="text-xs font-mono text-slate-400">
                        {new Date(selectedJob.startTime).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          if (selectedJob) {
                            await api.deleteJob(selectedJob.id);
                            await fetchJobs();
                            setSelectedJob(null);
                          }
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg border border-rose-200 dark:border-rose-900/60 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Delete this job from history"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Job</span>
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Stage: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedJob.currentStage}</span>
                  </p>
                </div>

                {/* Live Event Logs */}
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-blue-500" />
                    <span>Sequential Event Audit Log ({selectedJob.logs?.length || 0} events)</span>
                  </h3>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {selectedJob.logs?.map(log => (
                      <div
                        key={log.id}
                        className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs flex items-start gap-2.5"
                      >
                        {log.severity === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        ) : log.severity === 'warning' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        ) : log.severity === 'error' ? (
                          <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        ) : (
                          <Clock className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                              {log.eventType}
                            </span>
                            <span className="text-slate-400 text-[10px]">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                            {log.message}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                Select a background job from the list to view its audit log and performance telemetry.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
