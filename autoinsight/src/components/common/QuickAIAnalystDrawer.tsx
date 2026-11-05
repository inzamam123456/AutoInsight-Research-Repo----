import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Sparkles,
  Send,
  X,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Database,
  ArrowRight,
  HelpCircle,
  ShieldCheck,
  Calculator,
  Flame,
  ChevronDown
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { ChatMessage, VerificationEvidence } from '../../types';

export const QuickAIAnalystDrawer: React.FC = () => {
  const { activeDataset, datasets, setActiveDatasetId, setActiveView, recordAnalysisHistory } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([
    'What was the total profit margin across all regions?',
    'Which product category generated the highest volume?',
    'How many duplicate records were removed during cleaning?',
    'Identify any negative profit outliers in the dataset.'
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Load existing conversation when opening or active dataset changes
  useEffect(() => {
    if (!activeDataset || !isOpen) return;

    const loadConversation = async () => {
      try {
        const conv = await api.getConversation(activeDataset.id);
        if (conv && conv.messages) {
          setMessages(conv.messages);
        }
      } catch (err) {
        console.warn('Could not load chat conversation:', err);
      }
    };
    loadConversation();
  }, [activeDataset, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const queryText = (textToSend || question).trim();
    if (!queryText || !activeDataset || loading) return;

    const tempUserMsg: ChatMessage = {
      id: 'temp_' + Date.now(),
      conversationId: 'temp_conv',
      role: 'user',
      content: queryText,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, tempUserMsg]);
    setQuestion('');
    setLoading(true);

    try {
      const res = await api.sendChatMessage(activeDataset.id, queryText);
      setMessages(prev => [...prev.filter(m => m.id !== tempUserMsg.id), tempUserMsg, res.message]);

      if (res.suggestedFollowUps && res.suggestedFollowUps.length > 0) {
        setSuggestedPrompts(res.suggestedFollowUps);
      }

      // Record to database history
      await recordAnalysisHistory({
        datasetId: activeDataset.id,
        datasetName: activeDataset.name,
        queryPrompt: queryText,
        insightsCount: 1,
        qualityScore: 100,
        status: 'completed',
        summary: res.message.content.slice(0, 180) + '...'
      });
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: 'err_' + Date.now(),
        conversationId: 'temp_conv',
        role: 'assistant',
        content: `Analysis failed: ${err.message || 'Could not compute verifiable answer.'}`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  if (!activeDataset && datasets.length === 0) {
    return null;
  }

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-full shadow-2xl hover:shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 cursor-pointer electric-glow border border-blue-400/30 group"
          title="Ask AI Data Analyst about current dataset"
        >
          <div className="p-1 rounded-full bg-white/20 group-hover:scale-110 transition-transform">
            <Sparkles className="w-4 h-4 text-cyan-200" />
          </div>
          <span className="text-xs font-bold tracking-wide">
            Ask AI Analyst
          </span>
          {activeDataset && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-900/60 text-cyan-200 font-mono hidden sm:inline max-w-[120px] truncate border border-blue-400/20">
              {activeDataset.name}
            </span>
          )}
        </button>
      )}

      {/* Slide-over / Docked Drawer */}
      {isOpen && (
        <div
          className={`fixed bottom-4 right-4 z-50 w-full sm:w-[480px] bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-blue-900/60 rounded-2xl shadow-2xl flex flex-col transition-all overflow-hidden ${
            isMinimized ? 'h-16' : 'h-[620px] max-h-[90vh]'
          }`}
          style={{ backdropFilter: 'blur(16px)' }}
        >
          {/* Drawer Header */}
          <div className="p-3.5 px-4 bg-gradient-to-r from-[#0F172A] to-[#1E293B] text-white flex items-center justify-between border-b border-blue-900/40">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 rounded-lg bg-blue-600/40 border border-blue-400/30 text-cyan-300">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold truncate">AI Data Analyst</h3>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                    Verified Proof
                  </span>
                </div>
                {/* Dataset switcher dropdown */}
                {datasets.length > 0 && (
                  <select
                    value={activeDataset?.id || ''}
                    onChange={(e) => setActiveDatasetId(e.target.value)}
                    className="text-[10px] bg-slate-900/80 border border-slate-700 text-slate-300 rounded px-1.5 py-0.5 mt-0.5 focus:outline-none max-w-[200px] truncate"
                  >
                    {datasets.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-300">
              <button
                onClick={() => {
                  setActiveView('ai_analyst');
                  setIsOpen(false);
                }}
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title="Open Fullscreen Analyst Workspace"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title={isMinimized ? 'Expand Drawer' : 'Minimize Drawer'}
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                title="Close Drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Message List */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-[#070D1E]/60 text-xs">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col justify-center items-center text-center p-6 space-y-3">
                    <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 text-blue-600 dark:text-cyan-400">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        Ask Anything About {activeDataset?.name || 'Your Data'}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                        Every answer is mathematically verified against the active dataset records with audit evidence.
                      </p>
                    </div>

                    {/* Suggested questions */}
                    <div className="w-full pt-3 space-y-1.5 text-left">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Suggested Prompts:
                      </span>
                      {suggestedPrompts.slice(0, 3).map((prompt, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(prompt)}
                          className="w-full text-left p-2 rounded-lg bg-white dark:bg-slate-900/80 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-blue-900/40 text-slate-700 dark:text-slate-200 transition-colors text-[11px] font-medium"
                        >
                          → {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col ${
                        m.role === 'user' ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div
                        className={`max-w-[88%] p-3 rounded-xl leading-relaxed ${
                          m.role === 'user'
                            ? 'bg-blue-600 text-white rounded-br-none shadow-xs'
                            : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200 dark:border-slate-800 shadow-xs'
                        }`}
                      >
                        <p className="whitespace-pre-line">{m.content}</p>

                        {/* Evidence Proof Badge if Assistant */}
                        {m.evidence && (
                          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1 text-[10px]">
                            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                              <ShieldCheck className="w-3 h-3" />
                              <span>Verified Against {m.evidence.recordsExamined} Records</span>
                            </div>
                            {m.evidence.calculatedMetricFormula && (
                              <div className="p-1.5 bg-slate-50 dark:bg-slate-800/60 rounded font-mono text-[9px] text-slate-600 dark:text-slate-400">
                                {m.evidence.calculatedMetricFormula}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <span className="text-[9px] text-slate-400 mt-1 px-1">
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}

                {loading && (
                  <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 w-fit">
                    <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                    <span className="text-xs font-medium">Computing verified answer from dataset...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-3 bg-white dark:bg-[#0B132B] border-t border-slate-200 dark:border-blue-900/40">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    placeholder={`Ask about ${activeDataset?.name || 'dataset'}...`}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    disabled={loading}
                    className="flex-1 px-3.5 py-2 text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-blue-900/60 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!question.trim() || loading}
                    className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};
