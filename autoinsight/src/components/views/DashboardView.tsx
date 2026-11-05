import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  Filter,
  Download,
  FileText,
  RotateCcw,
  Sparkles,
  Info,
  Maximize2,
  Minimize2,
  Table as TableIcon,
  ChevronDown,
  ChevronUp,
  Search,
  Activity,
  Layers,
  CheckCircle2,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { DashboardConfig, ChartDef, KPICardDef } from '../../types';
import { AutoChart, ChartClickEvent, ChartHoverEvent } from '../charts/AutoChart';
import { ExplainChartModal } from '../common/ExplainChartModal';

export const DashboardView: React.FC = () => {
  const { activeDataset, setActiveView, theme } = useApp();
  const [dashboard, setDashboard] = useState<DashboardConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [selectedChartForExplanation, setSelectedChartForExplanation] = useState<ChartDef | null>(null);
  const [focusedChart, setFocusedChart] = useState<ChartDef | null>(null);

  // Tableau / PowerBI Single-Frame & Presentation States
  const [isSingleFrame, setIsSingleFrame] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDataTable, setShowDataTable] = useState(false);
  const [tableSearch, setTableSearch] = useState('');
  const [saveReportSuccess, setSaveReportSuccess] = useState(false);

  // Real-time Linked Cross-Filtering State
  const [activeCrossFilter, setActiveCrossFilter] = useState<{
    column: string;
    value: string;
    chartId?: string;
  } | null>(null);

  // Real-time Hover Telemetry
  const [hoveredPoint, setHoveredPoint] = useState<ChartHoverEvent | null>(null);

  useEffect(() => {
    if (!activeDataset) return;
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const [dashData, rowData] = await Promise.all([
          api.getDashboard(activeDataset.id),
          api.getDatasetRows(activeDataset.id, activeDataset.currentVersion, 1, 250)
        ]);
        setDashboard(dashData);
        setRows(rowData.rows || []);
      } catch (err) {
        console.warn('Dashboard loading error:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, [activeDataset]);

  // Real-time filtered rows based on active cross-filter and table search
  const filteredRows = useMemo(() => {
    let result = rows;
    if (activeCrossFilter) {
      const col = activeCrossFilter.column;
      const targetVal = String(activeCrossFilter.value).toLowerCase().trim();
      result = result.filter(r => {
        // Match exact column or any column containing this value
        if (r[col] !== undefined && r[col] !== null) {
          return String(r[col]).toLowerCase().trim() === targetVal;
        }
        return Object.values(r).some(v => String(v).toLowerCase().trim() === targetVal);
      });
    }
    if (tableSearch) {
      const s = tableSearch.toLowerCase().trim();
      result = result.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(s)));
    }
    return result;
  }, [rows, activeCrossFilter, tableSearch]);

  // Real-time dynamically recalculated KPIs for cross-filtered subset (PowerBI Card Visuals)
  const dynamicKPIs: KPICardDef[] = useMemo(() => {
    if (!dashboard?.kpis) return [];
    if (!activeCrossFilter) return dashboard.kpis;

    return dashboard.kpis.map(kpi => {
      if (kpi.sourceColumn === 'ROW_COUNT') {
        const pct = rows.length > 0 ? Math.round((filteredRows.length / rows.length) * 100) : 100;
        return {
          ...kpi,
          value: `${filteredRows.length.toLocaleString()}`,
          explanation: `Filtered subset: ${filteredRows.length} of ${rows.length} total records (${pct}% of dataset)`
        };
      }

      // If metric is numeric column
      const numCol = kpi.sourceColumn;
      const numbers = filteredRows
        .map(r => {
          const val = r[numCol];
          if (typeof val === 'number') return val;
          if (val === null || val === undefined) return null;
          const cleaned = String(val).replace(/[$,€£¥%]/g, '').trim();
          const parsed = Number(cleaned);
          return isNaN(parsed) ? null : parsed;
        })
        .filter((n): n is number => n !== null);

      if (numbers.length > 0) {
        const sum = numbers.reduce((a, b) => a + b, 0);
        const avg = sum / numbers.length;
        const isSum = kpi.formula.toLowerCase().includes('sum');
        const isAvg = kpi.formula.toLowerCase().includes('avg');

        if (isSum) {
          return {
            ...kpi,
            value: kpi.format === 'currency' ? `$${sum.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : sum.toLocaleString(),
            explanation: `Dynamic sum across ${numbers.length} filtered records for ${activeCrossFilter.value}`
          };
        } else if (isAvg) {
          return {
            ...kpi,
            value: kpi.format === 'currency' ? `$${avg.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : (Math.round(avg * 100) / 100).toLocaleString(),
            explanation: `Dynamic average per filtered record for ${activeCrossFilter.value}`
          };
        }
      }

      return kpi;
    });
  }, [dashboard, activeCrossFilter, filteredRows, rows]);

  // Handle Chart Click (Cross-Filtering / Slicing)
  const handleChartClick = (event: ChartClickEvent) => {
    if (activeCrossFilter && activeCrossFilter.value.toLowerCase() === event.value.toLowerCase()) {
      // Toggle off when clicking the same element again
      setActiveCrossFilter(null);
    } else {
      // Set new active cross filter
      setActiveCrossFilter({
        column: event.dimensionColumn || 'category',
        value: event.value,
        chartId: event.chartId
      });
    }
  };

  // Handle Chart Hover (Real-time telemetry)
  const handleChartHover = (event: ChartHoverEvent) => {
    setHoveredPoint(event);
  };

  const handleClearCrossFilter = () => {
    setActiveCrossFilter(null);
  };

  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleExportCSV = () => {
    if (filteredRows.length === 0) return;
    const headers = Object.keys(filteredRows[0]).join(',');
    const csvContent = headers + '\n' + filteredRows.map(r => Object.values(r).map(v => typeof v === 'string' && v.includes(',') ? `"${v}"` : v).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeDataset?.name.toLowerCase().replace(/\s+/g, '_')}_${activeCrossFilter ? activeCrossFilter.value.toLowerCase() : 'all'}.csv`;
    a.click();
  };

  const handleSaveReportSnapshot = async () => {
    if (!activeDataset || !dashboard) return;
    try {
      await api.createReport({
        datasetId: activeDataset.id,
        title: `${activeDataset.name} — PowerBI / Tableau Executive Report`,
        summary: `Executive single-frame report generated from ${activeDataset.rowCount} verified records with interactive cross-filtering capabilities.`,
        kpis: dynamicKPIs,
        charts: dashboard.charts,
        keyFindings: dashboard.charts.map(c => c.analyticalExplanation?.summary).filter(Boolean) as string[]
      });
      setSaveReportSuccess(true);
      setTimeout(() => setSaveReportSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving report:', err);
    }
  };

  if (!activeDataset) {
    return (
      <div className="p-12 text-center text-slate-500 max-w-md mx-auto">
        <p className="text-sm font-semibold">No dataset selected.</p>
        <button
          onClick={() => setActiveView('new_analysis')}
          className="mt-3 px-4 py-2 text-xs font-semibold bg-[#2563EB] text-white rounded-lg shadow-sm"
        >
          Upload a Dataset
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-slate-400">
        <div className="w-9 h-9 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
          Rendering Tableau / PowerBI Single-Frame Canvas...
        </p>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col transition-all duration-200 ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-[#F8FAFC] dark:bg-slate-950 p-4 md:p-6 overflow-hidden'
          : isSingleFrame
          ? 'h-[calc(100vh-4rem)] p-3 md:p-5 overflow-hidden'
          : 'p-4 md:p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto'
      }`}
    >
      {/* TABLEAU / POWERBI CANVAS HEADER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-slate-200 dark:border-slate-800 shrink-0">
        {/* Left Title & Status */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[#172554] to-[#2563EB] text-white shadow-xs">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm md:text-base font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
                {activeDataset.name}
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800 uppercase">
                {activeDataset.fileFormat} · v{activeDataset.currentVersion}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Tableau / PowerBI Interactive Canvas · Click any chart element to cross-filter in real-time
            </p>
          </div>
        </div>

        {/* Right Canvas Slicers & Presentation Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Layout Mode Toggle (Single-Frame vs Scrollable) */}
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800/80 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setIsSingleFrame(true)}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                isSingleFrame
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="One-Frame Canvas: All charts fit in one viewport without scrolling"
            >
              Single-Frame
            </button>
            <button
              onClick={() => setIsSingleFrame(false)}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                !isSingleFrame
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Expanded Canvas: Larger chart heights with bottom records table"
            >
              Expanded
            </button>
          </div>

          {/* Fullscreen / Presentation Mode */}
          <button
            onClick={handleToggleFullscreen}
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title={isFullscreen ? 'Exit Presentation Mode' : 'Tableau Presentation Mode (Fullscreen)'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg shadow-2xs transition-colors"
            title="Download current filtered data as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          {/* Save Report Snapshot */}
          <button
            onClick={handleSaveReportSnapshot}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#172554] hover:bg-[#1e3a8a] text-white rounded-lg shadow-xs transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-teal-300" />
            <span>{saveReportSuccess ? 'Saved!' : 'Save Report'}</span>
          </button>
        </div>
      </div>

      {/* ACTIVE CROSS-FILTER & REAL-TIME HOVER STATUS STRIP */}
      <div className="flex flex-wrap items-center justify-between gap-2 py-2 text-xs shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          {activeCrossFilter ? (
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 rounded-lg font-medium shadow-2xs animate-in fade-in duration-150">
              <span className="flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                <Filter className="w-3 h-3" />
                Cross-Filter Active:
              </span>
              <span className="font-bold">
                {activeCrossFilter.value}
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-600 dark:text-slate-300">
                {filteredRows.length} of {rows.length} records ({Math.round((filteredRows.length / rows.length) * 100)}%)
              </span>
              <button
                onClick={handleClearCrossFilter}
                className="ml-1 p-0.5 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 transition-colors"
                title="Clear cross-filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Real-Time Linked Canvas</span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span>All {rows.length} records active</span>
            </div>
          )}
        </div>

        {/* Real-time Hover Telemetry Badge */}
        <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-2">
          {hoveredPoint ? (
            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md">
              <Activity className="w-3 h-3" />
              <span>
                Hovered: <strong>{hoveredPoint.value}</strong>
              </span>
            </div>
          ) : (
            <span className="text-slate-400">Hover over any chart for live telemetry</span>
          )}
        </div>
      </div>

      {/* POWERBI STYLE COMPACT KPI CARDS RIBBON */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pb-2.5 shrink-0">
        {dynamicKPIs.map(kpi => (
          <div
            key={kpi.id}
            className={`px-3.5 py-2.5 rounded-xl border bg-white dark:bg-slate-900 transition-all ${
              activeCrossFilter
                ? 'border-blue-200 dark:border-blue-900/60 shadow-2xs'
                : 'border-slate-200 dark:border-slate-800 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span className="font-semibold truncate">{kpi.title}</span>
              <span className="cursor-help shrink-0 ml-1" title={kpi.explanation}>
                <Info className="w-3 h-3 text-slate-400" />
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {kpi.value}
              </span>
              {activeCrossFilter && kpi.sourceColumn === 'ROW_COUNT' && (
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                  ({Math.round((filteredRows.length / rows.length) * 100)}%)
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* TABLEAU / POWERBI SINGLE-FRAME CHARTS GRID */}
      <div
        className={`flex-1 min-h-0 w-full ${
          isSingleFrame
            ? 'grid grid-cols-1 md:grid-cols-12 gap-3 h-full overflow-hidden'
            : 'grid grid-cols-1 lg:grid-cols-2 gap-4'
        }`}
      >
        {dashboard?.charts.map((chart, idx) => {
          // Layout grid spans for a Tableau-style balanced executive canvas:
          // Chart 0 (Time-series / Primary trend): 7 cols
          // Chart 1 (Category comparison bar): 5 cols
          // Chart 2 (Donut / Segment distribution): 5 cols
          // Chart 3 (Scatter / Bivariate correlation): 7 cols
          let colSpan = 'md:col-span-6';
          if (isSingleFrame) {
            if (idx === 0) colSpan = 'md:col-span-7';
            else if (idx === 1) colSpan = 'md:col-span-5';
            else if (idx === 2) colSpan = 'md:col-span-5';
            else if (idx === 3) colSpan = 'md:col-span-7';
          }

          return (
            <div
              key={chart.id}
              className={`${colSpan} flex flex-col h-full min-h-[220px] transition-all`}
            >
              <AutoChart
                chart={chart}
                isSingleFrame={isSingleFrame}
                onExplain={() => setSelectedChartForExplanation(chart)}
                onExpand={() => setFocusedChart(chart)}
                onPointClick={handleChartClick}
                onPointHover={handleChartHover}
                activeCrossFilter={activeCrossFilter}
              />
            </div>
          );
        })}
      </div>

      {/* BOTTOM DATA INSPECTOR TRAY (TOGGLEABLE OR ALWAYS VISIBLE IN EXPANDED MODE) */}
      <div className="mt-2 shrink-0 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div
          onClick={() => setShowDataTable(!showDataTable)}
          className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors select-none"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
            <TableIcon className="w-3.5 h-3.5 text-blue-500" />
            <span>
              Underlying Verified Data Records ({filteredRows.length} {activeCrossFilter ? `filtered for "${activeCrossFilter.value}"` : 'records'})
            </span>
            {activeCrossFilter && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                Sliced
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>{showDataTable ? 'Collapse Inspector' : 'Expand Inspector'}</span>
            {showDataTable ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>

        {showDataTable && (
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2 animate-in fade-in duration-150">
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter records..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <span className="text-[11px] text-slate-400">
                Displaying first 25 matching records
              </span>
            </div>

            <div className="overflow-x-auto max-h-48 border border-slate-100 dark:border-slate-800 rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0">
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    {Object.keys(rows[0] || {}).map(col => (
                      <th
                        key={col}
                        className={`p-2 font-semibold whitespace-nowrap ${
                          activeCrossFilter?.column === col
                            ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/40'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredRows.slice(0, 25).map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      {Object.keys(rows[0] || {}).map((col, j) => {
                        const val = r[col];
                        const isMatch = activeCrossFilter && String(val).toLowerCase() === activeCrossFilter.value.toLowerCase();
                        return (
                          <td
                            key={j}
                            className={`p-2 whitespace-nowrap text-slate-600 dark:text-slate-300 ${
                              isMatch ? 'font-bold text-blue-600 dark:text-blue-400 bg-blue-50/30' : ''
                            }`}
                          >
                            {val === null || val === undefined || val === '' ? (
                              <span className="text-slate-400 italic">null</span>
                            ) : (
                              String(val)
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Explain Chart Modal */}
      <ExplainChartModal
        chart={selectedChartForExplanation}
        onClose={() => setSelectedChartForExplanation(null)}
        onAskAnalyst={() => setActiveView('ai_analyst')}
      />

      {/* Focus View Modal */}
      {focusedChart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-4xl h-[75vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {focusedChart.title} — Focused Tableau View
              </h2>
              <button
                onClick={() => setFocusedChart(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 p-4">
              <AutoChart
                chart={focusedChart}
                onPointClick={handleChartClick}
                onPointHover={handleChartHover}
                activeCrossFilter={activeCrossFilter}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
