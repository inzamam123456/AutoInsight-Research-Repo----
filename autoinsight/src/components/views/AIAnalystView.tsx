import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Bot,
  User,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  Database,
  Layers,
  Info,
  Clock,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { ChatMessage, VerificationEvidence } from '../../types';
import { EvidenceModal } from '../common/EvidenceModal';

export const AIAnalystView: React.FC = () => {
  const { activeDataset, setActiveView, recordAnalysisHistory } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<VerificationEvidence | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Suggested questions
  const suggestedQuestions = [
    'What are the main findings in this dataset?',
    'Which category generated the highest total?',
    'What is the overall average per record?',
    'Are there unusual statistical outliers?',
    'What is the correlation between the key numeric fields?',
    'What limitations or caveats should I consider?'
  ];

  useEffect(() => {
    if (!activeDataset) return;
    const fetchConversation = async () => {
      try {
        const conv = await api.getConversation(activeDataset.id);
        if (conv?.messages) {
          setMessages(conv.messages);
        }
      } catch (err) {
        console.warn('Could not load conversation:', err);
      }
    };
    fetchConversation();
  }, [activeDataset]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const question = textToSend || inputValue;
    if (!question.trim() || !activeDataset || loading) return;

    setInputValue('');
    setLoading(true);

    // Optimistically add user message
    const tempUserMsg: ChatMessage = {
      id: 'temp_user_' + Date.now(),
      conversationId: '',
      role: 'user',
      content: question,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await api.sendChatMessage(activeDataset.id, question);
      setMessages(prev => {
        const withoutTemp = prev.filter(m => m.id !== tempUserMsg.id);
        return [...withoutTemp, tempUserMsg, res.message];
      });

      // Record to persistent database history
      await recordAnalysisHistory({
        datasetId: activeDataset.id,
        datasetName: activeDataset.name,
        queryPrompt: question,
        insightsCount: 1,
        qualityScore: 100,
        status: 'completed',
        summary: res.message.content.slice(0, 160) + '...'
      });
    } catch (err: any) {
      console.error('Chat error:', err);
      const errMsg: ChatMessage = {
        id: 'err_' + Date.now(),
        conversationId: '',
        role: 'assistant',
        content: `Error evaluating question: ${err.message || 'The analytical service was temporarily unable to answer.'}`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!activeDataset) {
    return (
      <div className="p-12 text-center text-slate-500 max-w-md mx-auto">
        <p className="text-sm font-semibold">Please select or upload a dataset first.</p>
        <button
          onClick={() => setActiveView('new_analysis')}
          className="mt-3 px-4 py-2 text-xs font-semibold bg-[#2563EB] text-white rounded-lg"
        >
          Upload a Dataset
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-5xl mx-auto p-4 md:p-6">
      {/* Header Info */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bot className="w-4 h-4 text-[#2563EB]" />
            <span>AI Data Analyst — Verifiable Assistant</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Active Dataset: <strong className="text-slate-800 dark:text-slate-200">{activeDataset.name}</strong> (v{activeDataset.currentVersion}, {activeDataset.rowCount} rows)
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Evidence Verification Active</span>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto py-4 space-y-5">
        {messages.length === 0 ? (
          <div className="py-8 text-center space-y-4 max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] flex items-center justify-center mx-auto shadow-xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Ask anything about your data
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Every calculation is deterministically verified against your actual records.
              </p>
            </div>

            <div className="pt-2 text-left space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Suggested Questions
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(q)}
                    className="p-2.5 text-left text-xs bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 transition-colors shadow-2xs"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 text-xs leading-relaxed ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-[#172554] text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-xl p-4 shadow-2xs space-y-3 ${
                    isUser
                      ? 'bg-[#2563EB] text-white rounded-br-xs'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-xs'
                  }`}
                >
                  {/* Content with markdown bolding */}
                  <div className="whitespace-pre-wrap">
                    {msg.content.split('\n').map((line, i) => (
                      <p key={i} className={i > 0 ? 'mt-2' : ''}>
                        {line}
                      </p>
                    ))}
                  </div>

                  {/* Evidence & Action Ribbon if assistant message */}
                  {!isUser && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {msg.evidence && (
                          <button
                            onClick={() => setSelectedEvidence(msg.evidence!)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                              msg.evidence.verificationStatus === 'verified_calculation'
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            }`}
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>
                              {msg.evidence.verificationStatus === 'verified_calculation'
                                ? 'Inspect Verified Evidence'
                                : 'Inspect Evidence'}
                            </span>
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => handleCopyText(msg.id, msg.content)}
                        className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Copy answer"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-emerald-500">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Follow-up suggestions */}
                  {!isUser && msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                    <div className="pt-2 space-y-1">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                        Suggested Follow-ups
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.suggestedFollowUps.map((f, i) => (
                          <button
                            key={i}
                            onClick={() => handleSendMessage(f)}
                            className="px-2.5 py-1 text-[11px] bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-slate-600 dark:text-slate-300 hover:text-blue-600 rounded-md border border-slate-200 dark:border-slate-700 transition-colors"
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {loading && (
          <div className="flex items-center gap-2.5 text-xs text-slate-500 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-xs shadow-2xs">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
            <span>Calculating deterministic aggregates & verifying...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask a question about this dataset (e.g. Which category had highest profit?)..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
          />
          <button
            type="submit"
            disabled={loading || !inputValue.trim()}
            className="px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-bold shadow-xs disabled:opacity-40 transition-colors flex items-center gap-1.5"
          >
            <span>Ask</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Evidence Modal */}
      <EvidenceModal
        evidence={selectedEvidence}
        onClose={() => setSelectedEvidence(null)}
      />
    </div>
  );
};
