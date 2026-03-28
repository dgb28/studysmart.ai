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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="glass-panel w-full max-w-lg rounded-3xl p-8 border-orange-500/20 shadow-[0_0_50px_rgba(249,115,22,0.15)] relative overflow-hidden slide-in-from-bottom-8">
        
        {/* Decorative background glow */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 mb-6 relative z-10">
          <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
            <AlertCircle className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">You've slowed down.</h2>
            <p className="text-orange-200/80">I noticed you've been inactive for a while.</p>
          </div>
        </div>

        <p className="text-gray-300 mb-8 relative z-10 text-lg">
          What is blocking you right now? Let's get you back on track.
        </p>

        <div className="grid grid-cols-1 gap-3 relative z-10">
          <button 
            onClick={() => { onAction("break"); onClose(); }}
            className="flex items-center gap-3 w-full p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gray-500 transition-all text-left group"
          >
            <Coffee className="w-5 h-5 text-gray-400 group-hover:text-white" />
            <div className="flex-1">
              <div className="font-semibold text-white">I need a break</div>
              <div className="text-sm text-gray-400">Pause timer and rest for 5 mins</div>
            </div>
          </button>

          <button 
            onClick={() => { onAction("confused"); onClose(); }}
            className="flex items-center gap-3 w-full p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/50 transition-all text-left group"
          >
            <Brain className="w-5 h-5 text-blue-400 group-hover:text-blue-300" />
            <div className="flex-1">
              <div className="font-semibold text-white">I'm confused</div>
              <div className="text-sm text-gray-400">Ask the AI coach to explain differently</div>
            </div>
          </button>

          <button 
            onClick={() => { onAction("thinking"); onClose(); }}
            className="flex items-center gap-3 w-full p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-green-500/50 transition-all text-left group"
          >
            <Target className="w-5 h-5 text-green-400 group-hover:text-green-300" />
            <div className="flex-1">
              <div className="font-semibold text-white">Just thinking</div>
              <div className="text-sm text-gray-400">Resume timer, no help needed</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
