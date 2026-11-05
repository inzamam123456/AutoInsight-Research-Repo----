import React from 'react';
import {
  UploadCloud,
  ShieldCheck,
  BarChart3,
  Bot,
  Layers,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Lock,
  Database
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const LandingPage: React.FC = () => {
  const { setActiveView, openAuthModal } = useApp();

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col">
      {/* Header */}
      <header className="h-16 px-6 md:px-12 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[#172554] to-[#2563EB] text-white shadow-xs">
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
              <circle cx="19" cy="9" r="1.5" fill="#0D9488" stroke="none" />
            </svg>
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
            AutoInsight
            <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]" />
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => openAuthModal('login')}
            className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 px-3 py-1.5"
          >
            Sign In
          </button>
          <button
            onClick={() => setActiveView('new_analysis')}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-lg shadow-xs transition-colors"
          >
            <span>Start Free Analysis</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6 text-center max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs font-bold text-[#2563EB] dark:text-blue-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI-Powered Automated Data Cleaning & Verifiable Dashboards</span>
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
          From Raw Data to <span className="text-[#2563EB]">Reliable Insights.</span>
        </h1>

        <p className="text-base md:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Upload any messy CSV or Excel spreadsheet. AutoInsight detects data quality issues, performs deterministic cleaning, builds interactive dashboards, and provides answers backed by verifiable calculation audits.
        </p>

        <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => setActiveView('new_analysis')}
            className="px-6 py-3 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-sm font-bold shadow-md transition-all flex items-center gap-2"
          >
            <span>Upload a Dataset Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveView('overview')}
            className="px-6 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm font-semibold shadow-2xs transition-all"
          >
            Explore Demo App
          </button>
        </div>

        {/* Feature Badges */}
        <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Zero SQL or Python Required</span>
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Traceable & Reversible Cleaning</span>
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>100% Deterministic Evidence Audits</span>
          </span>
        </div>
      </section>

      {/* 6-Phase Integrated Workflow Graphic */}
      <section className="py-16 px-6 bg-slate-50 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">
              End-to-End Analytics Engine
            </span>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Six Integrated Phases in One Platform
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] w-fit">
                <UploadCloud className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                1. Dataset Upload & Validation
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Seamless drag-and-drop ingestion of CSV, XLSX, XLS, and JSON files with strict format checks and immutable file preservation.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-[#0D9488] w-fit">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                2. Automated Cleaning & Profiling
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Detects duplicate rows, imputes missing values, strips whitespace, casts numbers, and handles statistical outliers with complete reversibility.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 w-fit">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                3. Interactive Dashboard Generation
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Smart visualization engine analyzes attributes to build custom KPI cards, time-series curves, category comparisons, and correlation scatter plots.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] w-fit">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                4. LLM-Powered Data Analyst
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Ask questions in plain conversational English. The analyst identifies the right metrics and returns plain-English explanations without hallucinations.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 w-fit">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                5. Evidence-Backed Answer Verification
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Every calculation includes a full Evidence Panel detailing exact source columns, formulas, row counts, and reproducibility tokens.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 w-fit">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                6. Orchestrator & Audit Monitoring
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Sequential workflow engine persists job progress, duration benchmarks, execution throughput (rows/sec), and detailed telemetry.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 px-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
        <p>© 2026 AutoInsight — From Raw Data to Reliable Insights. All rights reserved.</p>
      </footer>
    </div>
  );
};
