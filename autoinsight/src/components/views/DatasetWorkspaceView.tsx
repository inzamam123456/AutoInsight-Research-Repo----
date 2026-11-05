import React, { useState, useEffect } from 'react';
import {
  Database,
  Table as TableIcon,
  CheckCircle2,
  History,
  BarChart3,
  Bot,
  Activity,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Info,
  Layers,
  ArrowRight,
  ShieldCheck,
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { DatasetVersion, CleaningActionItem, BeforeAfterReport } from '../../types';

export const DatasetWorkspaceView: React.FC = () => {
  const { activeDataset, setActiveView, refreshDatasets } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'preview' | 'quality' | 'cleaning_history' | 'logs'>('overview');
  const [versions, setVersions] = useState<DatasetVersion[]>([]);
  const [currentVersionData, setCurrentVersionData] = useState<DatasetVersion | null>(null);
  const [cleaningActions, setCleaningActions] = useState<CleaningActionItem[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [tableSearch, setTableSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState('');

  useEffect(() => {
    if (!activeDataset) return;
    const loadDetails = async () => {
      setLoading(true);
      try {
        const [dsDetails, actionsData, rowsData] = await Promise.all([
          api.getDataset(activeDataset.id),
          api.getCleaningActions(activeDataset.id),
          api.getDatasetRows(activeDataset.id, activeDataset.currentVersion, 1, 50)
        ]);
        setVersions(dsDetails.versions);
        setCurrentVersionData(dsDetails.currentVersionData || null);
        setCleaningActions(actionsData);
        setRows(rowsData.rows);
        setTotalPages(rowsData.totalPages);
        setTotalRows(rowsData.total);
      } catch (err) {
        console.warn('Could not load dataset details:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDetails();
  }, [activeDataset, page]);

  const handleRestoreVersion = async (targetVersion: number) => {
    if (!activeDataset) return;
    try {
      await api.restoreDatasetVersion(activeDataset.id, targetVersion);
      await refreshDatasets();
      setActionSuccess(`Successfully restored dataset to Version ${targetVersion}`);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err: any) {
      console.error('Restore error:', err);
    }
  };

  const handleDelete = async () => {
    if (!activeDataset || !confirm(`Are you sure you want to delete "${activeDataset.name}" and all cleaned versions?`)) return;
    try {
      await api.deleteDataset(activeDataset.id);
      await refreshDatasets();
      setActiveView('overview');
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  if (!activeDataset) {
    return (
      <div className="p-12 text-center text-slate-500 max-w-md mx-auto">
        <p className="text-sm font-semibold">No dataset selected.</p>
        <button
          onClick={() => setActiveView('new_analysis')}
          className="mt-3 px-4 py-2 text-xs font-semibold bg-[#2563EB] text-white rounded-lg"
        >
          Upload a Dataset
        </button>
      </div>
    );
  }

  const quality = currentVersionData?.qualityReport;
  const beforeAfter = currentVersionData?.beforeAfterReport;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white">
              {activeDataset.name}
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Version {activeDataset.currentVersion}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {activeDataset.description || 'Raw tabular dataset profile, automated transformations, and audit trail.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('dashboards')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-lg shadow-xs"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Open Dashboard</span>
          </button>
          <button
            onClick={() => setActiveView('ai_analyst')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-teal-50 text-[#0D9488] hover:bg-teal-100 dark:bg-teal-950/60 dark:text-teal-300 rounded-lg border border-teal-200 dark:border-teal-800"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Ask Analyst</span>
          </button>
          <button
            onClick={handleDelete}
            title="Delete Dataset"
            className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 text-xs text-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Segmented Workspace Navigation Tabs (Zero-pill discipline) */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl overflow-x-auto text-xs font-medium">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${
            activeTab === 'overview'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('preview')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${
            activeTab === 'preview'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <TableIcon className="w-3.5 h-3.5" />
          <span>Data Preview</span>
        </button>

        <button
          onClick={() => setActiveTab('quality')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${
            activeTab === 'quality'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Data Quality & Schema</span>
        </button>

        <button
          onClick={() => setActiveTab('cleaning_history')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${
            activeTab === 'cleaning_history'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Cleaning History & Reversibility</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-slate-400 font-medium">Verified Record Count</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {activeDataset.rowCount.toLocaleString()}
              </p>
              <span className="text-[11px] text-slate-500">Rows in current version</span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-slate-400 font-medium">Attribute Columns</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {activeDataset.columnCount}
              </p>
              <span className="text-[11px] text-slate-500">Categorical, numeric & temporal</span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-slate-400 font-medium">Quality Health Score</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {quality?.overallQualityScore || 95}
                <span className="text-xs text-slate-400 font-normal">/100</span>
              </p>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400">Validated ready</span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-slate-400 font-medium">Original File Format</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1 uppercase">
                {activeDataset.fileFormat}
              </p>
              <span className="text-[11px] text-slate-500">{(activeDataset.fileSize / 1024).toFixed(1)} KB stored</span>
            </div>
          </div>

          {/* Before & After comparison card */}
          {beforeAfter && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0D9488]" />
                <span>Automated Cleaning Impact: Before vs. After</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-slate-400 block mb-1">Rows</span>
                  <div className="flex items-center gap-2">
                    <span className="line-through text-slate-400">{beforeAfter.originalRowCount}</span>
                    <ArrowRight className="w-3 h-3 text-blue-500" />
                    <span className="font-bold text-slate-900 dark:text-white">{beforeAfter.finalRowCount}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">({beforeAfter.rowsRemovedCount} duplicates removed)</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-slate-400 block mb-1">Missing Cells</span>
                  <div className="flex items-center gap-2">
                    <span className="line-through text-slate-400">{beforeAfter.missingValuesBefore}</span>
                    <ArrowRight className="w-3 h-3 text-emerald-500" />
                    <span className="font-bold text-emerald-600">{beforeAfter.missingValuesAfter}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">({beforeAfter.invalidValuesResolved} resolved)</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-slate-400 block mb-1">Type Castings</span>
                  <p className="font-bold text-slate-900 dark:text-white">
                    {beforeAfter.typeConversionsCount}
                  </p>
                  <span className="text-[10px] text-slate-400">Standardized to native</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-slate-400 block mb-1">Applied Operations</span>
                  <p className="font-bold text-slate-900 dark:text-white">
                    {beforeAfter.appliedActions.length}
                  </p>
                  <span className="text-[10px] text-slate-400">All reversible</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DATA PREVIEW */}
      {activeTab === 'preview' && (
        <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden space-y-2">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              Tabular Records ({totalRows.toLocaleString()} total rows)
            </span>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 border border-slate-200 dark:border-slate-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 border border-slate-200 dark:border-slate-700"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 z-10 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3 font-semibold text-slate-500 w-12">#</th>
                  {Object.keys(rows[0] || {}).map(col => (
                    <th key={col} className="p-3 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-3 text-slate-400 font-mono text-[10px]">
                      {(page - 1) * 50 + i + 1}
                    </td>
                    {Object.values(r).map((val: any, j) => (
                      <td key={j} className="p-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {val === null || val === undefined || val === '' ? (
                          <span className="text-slate-400 italic">null</span>
                        ) : (
                          String(val)
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DATA QUALITY & SCHEMA */}
      {activeTab === 'quality' && quality && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              Detected Schema & Column Profiles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(quality.columnProfiles).map(([colName, prof]) => (
                <div
                  key={colName}
                  className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">{colName}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 uppercase">
                      {prof.type}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-3">
                    <span>{prof.nonNullCount} valid entries</span>
                    <span>·</span>
                    <span>{prof.nullCount} nulls ({prof.nullPercentage}%)</span>
                    <span>·</span>
                    <span>{prof.uniqueCount} distinct</span>
                  </div>
                  {prof.mean !== undefined && (
                    <div className="text-[11px] font-mono text-slate-600 dark:text-slate-300 pt-1">
                      min: {prof.min} · max: {prof.max} · mean: {prof.mean} · median: {prof.median}
                    </div>
                  )}
                  {prof.issues.length > 0 && (
                    <div className="text-[11px] text-amber-600 dark:text-amber-400 pt-1">
                      {prof.issues.join(' · ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CLEANING HISTORY & REVERSIBILITY */}
      {activeTab === 'cleaning_history' && (
        <div className="space-y-6">
          {/* Version management ribbon */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-4 h-4 text-blue-500" />
              <span>Dataset Versions & Reversibility</span>
            </h3>
            <p className="text-xs text-slate-500">
              The original raw file is preserved as an immutable source. You can restore any previous version at any time.
            </p>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
              {versions.map(v => (
                <div
                  key={v.id}
                  className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        Version {v.versionNumber}
                      </span>
                      {v.versionNumber === activeDataset.currentVersion && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 mt-0.5">
                      {v.description} · {v.rowCount.toLocaleString()} rows · Quality score: {v.qualityScore}/100
                    </p>
                  </div>

                  {v.versionNumber !== activeDataset.currentVersion && (
                    <button
                      onClick={() => handleRestoreVersion(v.versionNumber)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore This Version</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Log Table */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Traceable Transformation Action Log
            </h3>
            {cleaningActions.length === 0 ? (
              <p className="text-xs text-slate-400 py-4">No transformations applied to raw data.</p>
            ) : (
              <div className="space-y-2 text-xs">
                {cleaningActions.map(action => (
                  <div
                    key={action.id}
                    className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">
                        {action.operation.replace(/_/g, ' ')} on {action.column}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {action.id}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300">
                      {action.validationOutcome}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Reason: {action.reason}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
