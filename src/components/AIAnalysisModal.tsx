'use client';

import { Card } from '@/components/ui';
import { X, Sparkles, Lightbulb, Target, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AIAnalysisResponse } from '@/types';

interface AIAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  isLoading: boolean;
  data: AIAnalysisResponse | null;
}

export function AIAnalysisModal({ isOpen, onClose, title, isLoading, data }: AIAnalysisModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-2xl relative z-10 shadow-2xl max-h-[80vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-zinc-100">{title}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-zinc-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 overflow-y-auto max-h-[calc(80vh-80px)]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                <p className="text-sm text-zinc-400">AI analiz yapıyor...</p>
              </div>
            ) : data?.success ? (
              <div className="space-y-6">
                {/* Analysis Summary */}
                <div className="p-4 bg-zinc-800/50 rounded-xl">
                  <p className="text-zinc-100 leading-relaxed">{data.analysis}</p>
                </div>

                {/* Insights */}
                {data.insights.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className="w-4 h-4 text-amber-500" />
                      <h3 className="text-sm font-semibold text-zinc-300">Bulgular</h3>
                    </div>
                    <div className="space-y-2">
                      {data.insights.map((insight, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                          <span className="text-amber-500 font-bold text-xs mt-0.5">{i + 1}</span>
                          <p className="text-sm text-zinc-300">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {data.recommendations.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="w-4 h-4 text-blue-500" />
                      <h3 className="text-sm font-semibold text-zinc-300">Öneriler</h3>
                    </div>
                    <div className="space-y-2">
                      {data.recommendations.map((rec, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                          <span className="text-blue-500 font-bold text-xs mt-0.5">{i + 1}</span>
                          <p className="text-sm text-zinc-300">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-red-400">{data?.error || 'Bir hata oluştu.'}</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
