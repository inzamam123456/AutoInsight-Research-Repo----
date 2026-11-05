import React, { useState, useEffect } from 'react';
import { FileText, Download, Trash2, Printer, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { SavedReport } from '../../types';

export const SavedReportsView: React.FC = () => {
  const { setActiveView } = useApp();
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<SavedReport | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      const data = await api.listReports();
      setReports(data);
      if (data.length > 0 && !selectedReport) {
        setSelectedReport(data[0]);
      }
    } catch (err) {
      console.warn('Error loading reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this saved report snapshot?')) return;
    try {
      await api.deleteReport(id);
      setReports(prev => prev.filter(r => r.id !== id));
      if (selectedReport?.id === id) {
        setSelectedReport(reports.find(r => r.id !== id) || null);
      }
    } catch (err) {
      console.error('Failed to delete report:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <span>Saved Executive Reports</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Archived snapshots of dashboards, key observations, and analytical summaries.
          </p>
        </div>

        {selectedReport && (
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg shadow-2xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save PDF</span>
          </button>
        )}
      </div>

      {reports.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            No saved executive reports yet
          </h3>
          <p className="text-xs text-slate-500">
            Open any dashboard and click "Save Executive Report" to archive an analytical snapshot.
          </p>
          <button
            onClick={() => setActiveView('dashboards')}
            className="px-4 py-2 text-xs font-semibold bg-[#2563EB] text-white rounded-lg"
          >
            Go to Dashboards
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List of Reports (1 col) */}
          <div className="space-y-3">
            {reports.map(report => {
              const isSelected = selectedReport?.id === report.id;
              return (
                <div
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-400 dark:bg-blue-950/40 dark:border-blue-600 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                      {report.title}
                    </h3>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(report.id); }}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-md"
                      title="Delete Report"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {report.summary}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                    <span>{report.datasetName}</span>
                    <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Report Document (2 cols) */}
          <div className="lg:col-span-2">
            {selectedReport && (
              <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                    AutoInsight Executive Snapshot
                  </span>
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                    {selectedReport.title}
                  </h2>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span>Source: {selectedReport.datasetName}</span>
                    <span>·</span>
                    <span>Created: {new Date(selectedReport.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  {selectedReport.summary}
                </div>

                {/* KPIs summary */}
                {selectedReport.kpis && selectedReport.kpis.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                      Key Performance Indicators
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {selectedReport.kpis.map((k, i) => (
                        <div key={i} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                          <span className="text-[11px] text-slate-500 block">{k.title}</span>
                          <span className="text-lg font-black text-slate-900 dark:text-white">{k.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key Observations */}
                {selectedReport.keyFindings && selectedReport.keyFindings.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                      Key Observations & Analytical Takeaways
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                      {selectedReport.keyFindings.map((finding, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{finding}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
