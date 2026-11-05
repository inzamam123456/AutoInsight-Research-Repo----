import React, { useState } from 'react';
import { X, Sparkles, TrendingUp, HelpCircle, ArrowRight, Lightbulb, CheckCircle2 } from 'lucide-react';
import { ChartDef } from '../../types';

interface ExplainChartModalProps {
  chart: ChartDef | null;
  onClose: () => void;
  onAskAnalyst?: (question: string) => void;
}

export const ExplainChartModal: React.FC<ExplainChartModalProps> = ({ chart, onClose, onAskAnalyst }) => {
  if (!chart) return null;

  const [activeTab, setActiveTab] = useState<'overview' | 'drivers' | 'next_steps'>('overview');
  const explanation = chart.analyticalExplanation;

  const handleAskQuestion = (q: string) => {
    onClose();
    if (onAskAnalyst) onAskAnalyst(q);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl max-h-[85vh] flex flex-col bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Chart Explanation & Insights
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {chart.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls (Segmented clean buttons) */}
        <div className="flex items-center gap-1 px-6 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'overview'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            What it Shows
          </button>
          <button
            onClick={() => setActiveTab('drivers')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'drivers'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Underlying Drivers
          </button>
          <button
            onClick={() => setActiveTab('next_steps')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'next_steps'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Next Steps
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 text-sm">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
                <p className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-1">
                  Summary
                </p>
                <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200">
                  {explanation?.summary || chart.description}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  Key Observations from the Data
                </h4>
                <ul className="space-y-2">
                  {explanation?.keyObservations?.map((obs, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{obs}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {explanation?.metricDefinition && (
                <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 text-[11px] font-mono text-slate-600 dark:text-slate-300">
                  <strong className="text-slate-800 dark:text-slate-200 font-sans">Formula:</strong> {explanation.metricDefinition}
                </div>
              )}
            </div>
          )}

          {activeTab === 'drivers' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Potential factors influencing the patterns in this visualization:
              </p>
              <div className="space-y-2">
                {explanation?.potentialDrivers?.map((driver, i) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                    {driver}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'next_steps' && (
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span>Recommended Follow-Up Investigations</span>
              </div>
              <div className="space-y-2">
                {explanation?.suggestedInvestigation?.map((step, i) => (
                  <div
                    key={i}
                    onClick={() => handleAskQuestion(`Can you investigate: ${step}`)}
                    className="p-3 rounded-lg bg-slate-50 hover:bg-blue-50 dark:bg-slate-800/40 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer text-xs text-slate-700 dark:text-slate-200 flex items-center justify-between group transition-colors"
                  >
                    <span>{step}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={() => handleAskQuestion(`Can you explain why certain values are high in the ${chart.title} chart?`)}
            className="text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8] dark:text-blue-400 flex items-center gap-1"
          >
            <span>Ask AI Analyst about this chart</span>
            <ArrowRight className="w-3 h-3" />
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
