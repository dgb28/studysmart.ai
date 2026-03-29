"use client";

import { AlertCircle, Target, Coffee, Brain } from "lucide-react";

interface FrictionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: string) => void;
}

export default function FrictionInterventionModal({ isOpen, onClose, onAction }: FrictionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-in fade-in duration-300 dark:bg-black/60">
      <div className="glass-panel w-full max-w-lg rounded-3xl p-8 border-orange-500/20 shadow-[0_0_50px_rgba(249,115,22,0.15)] relative overflow-hidden slide-in-from-bottom-8">
        
        {/* Decorative background glow */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 mb-6 relative z-10">
          <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
            <AlertCircle className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">You&apos;ve slowed down.</h2>
            <p className="text-orange-800/90 dark:text-orange-200/80">I noticed you&apos;ve been inactive for a while.</p>
          </div>
        </div>

        <p className="relative z-10 mb-8 text-lg text-slate-600 dark:text-gray-300">
          What is blocking you right now? Let&apos;s get you back on track.
        </p>

        <div className="grid grid-cols-1 gap-3 relative z-10">
          <button 
            onClick={() => { onAction("break"); onClose(); }}
            className="group flex w-full items-center gap-3 rounded-xl border border-[var(--border)] bg-black/[0.02] p-4 text-left transition-all hover:border-gray-400 hover:bg-black/[0.04] dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 dark:hover:border-gray-500"
          >
            <Coffee className="h-5 w-5 text-slate-500 group-hover:text-slate-900 dark:text-gray-400 dark:group-hover:text-white" />
            <div className="flex-1">
              <div className="font-semibold text-slate-900 dark:text-white">I need a break</div>
              <div className="text-sm text-slate-600 dark:text-gray-400">Pause timer and rest for 5 mins</div>
            </div>
          </button>

          <button 
            onClick={() => { onAction("confused"); onClose(); }}
            className="group flex w-full items-center gap-3 rounded-xl border border-[var(--border)] bg-black/[0.02] p-4 text-left transition-all hover:border-blue-500/50 hover:bg-black/[0.04] dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
          >
            <Brain className="h-5 w-5 text-blue-600 group-hover:text-blue-500 dark:text-blue-400 dark:group-hover:text-blue-300" />
            <div className="flex-1">
              <div className="font-semibold text-slate-900 dark:text-white">I&apos;m confused</div>
              <div className="text-sm text-slate-600 dark:text-gray-400">Ask the AI coach to explain differently</div>
            </div>
          </button>

          <button 
            onClick={() => { onAction("thinking"); onClose(); }}
            className="group flex w-full items-center gap-3 rounded-xl border border-[var(--border)] bg-black/[0.02] p-4 text-left transition-all hover:border-green-500/50 hover:bg-black/[0.04] dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
          >
            <Target className="h-5 w-5 text-green-600 group-hover:text-green-500 dark:text-green-400 dark:group-hover:text-green-300" />
            <div className="flex-1">
              <div className="font-semibold text-slate-900 dark:text-white">Just thinking</div>
              <div className="text-sm text-slate-600 dark:text-gray-400">Resume timer, no help needed</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
