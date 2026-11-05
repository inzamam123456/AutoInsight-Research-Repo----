import React from 'react';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  XCircle,
  Hash,
  Database,
  Filter,
  Layers,
  Info,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { VerificationEvidence } from '../../types';

interface EvidenceModalProps {
  evidence: VerificationEvidence | null;
  onClose: () => void;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({ evidence, onClose }) => {
  if (!evidence) return null;

  const getStatusBadge = () => {
    switch (evidence.verificationStatus) {
      case 'verified_calculation':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-semibold">Verified Calculation</span>
          </div>
        );
      case 'partially_verified':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-semibold">Partially Verified</span>
          </div>
        );
      case 'unverified_explanation':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <HelpCircle className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-semibold">Unverified Explanation</span>
          </div>
        );
      case 'verification_failed':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80">
            <XCircle className="w-4 h-4 text-rose-600" />
            <span className="text-xs font-semibold">Verification Failed</span>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Calculation Evidence & Verification Audit
            </h2>
            {getStatusBadge()}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5 text-sm">
          {/* Claim Box */}
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Verified Claim
            </p>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              "{evidence.claim}"
            </p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              {evidence.statusExplanation}
            </p>
          </div>

          {/* Dataset & Version metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Dataset Version</span>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                v{evidence.datasetVersion} · {evidence.datasetName}
              </span>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Records Included</span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {evidence.recordsIncludedCount.toLocaleString()} rows
              </span>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Records Excluded</span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {evidence.recordsExcludedCount.toLocaleString()} rows
              </span>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Reproducibility</span>
              <span className="text-[11px] font-mono font-medium text-slate-700 dark:text-slate-300 truncate block" title={evidence.reproducibilityToken}>
                {evidence.reproducibilityToken}
              </span>
            </div>
          </div>

          {/* Execution & Metric Formula */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Database className="w-3.5 h-3.5 text-blue-500" />
              <span>Deterministic Query Specification</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto">
              <code>{evidence.calculationQuery}</code>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              <strong>Mathematical Definition:</strong> {evidence.metricDefinition}
            </p>
          </div>

          {/* Intermediate Steps Audit */}
          {evidence.intermediateSteps && evidence.intermediateSteps.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Layers className="w-3.5 h-3.5 text-teal-500" />
                <span>Intermediate Execution Steps</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                {evidence.intermediateSteps.map((s, idx) => (
                  <div key={idx} className="p-2.5 text-xs flex items-start justify-between gap-3 bg-white dark:bg-slate-900">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {idx + 1}. {s.step}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 font-mono text-right shrink-0">
                      {typeof s.result === 'object' ? JSON.stringify(s.result) : String(s.result)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verification Checks Performed */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Independent Verification Checks</span>
            </div>
            <div className="space-y-1.5">
              {evidence.checksPerformed.map((c, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-xs"
                >
                  {c.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {c.checkName}
                    </span>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">{c.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Known Limitations */}
          {evidence.knownLimitations && evidence.knownLimitations.length > 0 && (
            <div className="p-3 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                <Info className="w-3.5 h-3.5" />
                <span>Known Limitations & Analytical Caveats</span>
              </div>
              <ul className="list-disc list-inside text-amber-900 dark:text-amber-200/90 space-y-0.5">
                {evidence.knownLimitations.map((lim, idx) => (
                  <li key={idx}>{lim}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Timestamp */}
          <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
            <span>Executed at {new Date(evidence.timestamp).toLocaleString()}</span>
            <span>Immutable Hash: {evidence.reproducibilityToken}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Close Evidence Audit
          </button>
        </div>
      </div>
    </div>
  );
};
