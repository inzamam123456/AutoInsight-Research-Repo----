import React from 'react';
import {
  HelpCircle,
  FileSpreadsheet,
  ShieldCheck,
  BarChart3,
  Bot,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const HelpDocView: React.FC = () => {
  const { setActiveView } = useApp();

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-blue-600" />
          <span>Help & Documentation</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          A guide designed for non-technical users to navigate automated data cleaning, dashboard generation, and verifiable analysis.
        </p>
      </div>

      {/* Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Phase 1: Upload */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] flex items-center justify-center font-bold text-sm">
            1
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Uploading Your Raw Dataset
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Drag and drop any CSV, Excel (.xlsx, .xls), or JSON file into AutoInsight. The system validates the table format, counts rows and columns, and preserves the original raw file immutably.
          </p>
          <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1 list-disc list-inside">
            <li>Supports files up to 25 MB safely.</li>
            <li>No code, formulas, or headers manual editing required.</li>
          </ul>
        </div>

        {/* Phase 2: Cleaning */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="w-9 h-9 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-[#0D9488] flex items-center justify-center font-bold text-sm">
            2
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Automated Profiling & Cleaning
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            The data engine profiles the dataset to detect missing cells, repeated duplicate rows, text numbers (like "$1,200.00"), and extreme statistical outliers.
          </p>
          <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1 list-disc list-inside">
            <li>Deterministic transformations with full reversibility.</li>
            <li>Compare Before vs. After metrics at any time.</li>
          </ul>
        </div>

        {/* Phase 3: Dashboards */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center font-bold text-sm">
            3
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Interactive Visual Dashboards
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            AutoInsight analyzes column types to choose the most meaningful charts: chronological line graphs for dates, ranked bar charts for categories, and scatter plots for correlations.
          </p>
          <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1 list-disc list-inside">
            <li>Click "Explain Chart" to read data-driven takeaways.</li>
            <li>Filter by category or search underlying rows directly.</li>
          </ul>
        </div>

        {/* Phase 4 & 5: AI Analyst & Evidence */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold text-sm">
            4 & 5
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Verifiable AI Analyst & Evidence
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Ask questions in plain English (e.g. "Which product has highest margin?"). The analyst runs exact mathematical queries and attaches an Evidence Panel.
          </p>
          <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1 list-disc list-inside">
            <li>Inspect the exact calculation formula and records included.</li>
            <li>Reproducible tokens ensure auditability.</li>
          </ul>
        </div>
      </div>

      {/* Verification Status Legend */}
      <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Understanding Verification Statuses
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400 mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Verified Calculation</span>
            </div>
            <p className="text-slate-500 text-[11px]">
              The calculation was executed and its result matched all data sanity and consistency checks.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 font-bold text-amber-600 dark:text-amber-400 mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span>Partially Verified</span>
            </div>
            <p className="text-slate-500 text-[11px]">
              Some calculation numbers are verified, but the narrative contains interpretive commentary.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
