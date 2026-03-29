"use client";

import { useState } from "react";
import { Mic, Send, Bot, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface EvaluationResult {
  clarity: number;
  correctness: number;
  gaps: string[];
  recommendations: string[];
}

interface ProofOfLearningModalProps {
  isOpen: boolean;
  topicTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProofOfLearningModal({ isOpen, topicTitle, onClose, onSuccess }: ProofOfLearningModalProps) {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!inputText.trim()) return;
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/evaluations/proof-of-learning`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic_title: topicTitle,
          explanation: inputText
        })
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
      } else {
        alert("Failed to evaluate. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Error reaching evaluator.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-md animate-in fade-in zoom-in-95 duration-300 dark:bg-black/80">
      <div className="glass-panel flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl border border-blue-500/30 p-8 shadow-[0_0_50px_rgba(59,130,246,0.15)]">
        
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              Proof of Learning
            </h2>
            <p className="text-sm text-slate-600 dark:text-gray-400">
              Explain what you learned to unlock the next topic.
            </p>
          </div>
        </div>

        {!result ? (
          <>
            <div className="relative mb-6 overflow-hidden rounded-2xl border border-[var(--border)] bg-slate-100/80 p-6 dark:bg-white/5 dark:border-white/10">
              <div className="absolute left-0 top-0 h-full w-1 bg-blue-500" />
              <p className="text-lg font-medium text-slate-900 dark:text-white">
                &quot;In your own words, briefly explain the concept of{" "}
                <span className="text-blue-600 dark:text-blue-400">&apos;{topicTitle}&apos;</span> in 2-3 sentences.&quot;
              </p>
            </div>

            <textarea 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Start typing your explanation here..."
              className="mb-4 h-32 w-full resize-none rounded-2xl border border-[var(--border)] bg-white p-4 text-slate-900 outline-none transition-colors placeholder:text-slate-500 focus:border-blue-500 dark:border-gray-700 dark:bg-black/50 dark:text-white dark:placeholder-gray-500"
              disabled={loading}
            />

            <div className="mt-auto flex items-center justify-between">
              {/* Optional: Add voice dictation UI here. We rely on ElevenLabs coach for purely conversational mode, 
                  but can put a mic button here for Speech-to-Text if needed. */}
              <button className="flex items-center gap-2 rounded-xl px-4 py-2 text-slate-600 transition-colors hover:text-slate-900 dark:text-gray-400 dark:hover:text-white">
                <Mic className="w-5 h-5" /> Use Voice
              </button>

              <button 
                onClick={handleSubmit}
                disabled={loading || !inputText.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-5 h-5" /> Submit</>}
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto pr-2 space-y-6 animate-in slide-in-from-bottom-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-panel p-4 rounded-2xl border-green-500/20 text-center">
                <div className="text-3xl font-bold text-green-400 mb-1">{result.correctness}%</div>
                <div className="text-xs uppercase tracking-wider text-slate-600 dark:text-gray-400">Correctness</div>
              </div>
              <div className="glass-panel p-4 rounded-2xl border-blue-500/20 text-center">
                <div className="text-3xl font-bold text-blue-400 mb-1">{result.clarity}%</div>
                <div className="text-xs uppercase tracking-wider text-slate-600 dark:text-gray-400">Clarity</div>
              </div>
            </div>

            {result.gaps.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-red-400 font-semibold flex items-center gap-2"><XCircle className="w-4 h-4"/> Knowledge Gaps</h3>
                <ul className="list-disc space-y-1 pl-5 text-slate-700 dark:text-gray-300">
                  {result.gaps.map((gap, i) => <li key={i}>{gap}</li>)}
                </ul>
              </div>
            )}

            {result.recommendations.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-purple-400 font-semibold flex items-center gap-2"><CheckCircle className="w-4 h-4"/> Recommendations</h3>
                <ul className="list-disc space-y-1 pl-5 text-slate-700 dark:text-gray-300">
                  {result.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                </ul>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3 border-t border-[var(--border)] pt-6 dark:border-white/10">
              <button
                onClick={() => {
                  setResult(null);
                  setInputText("");
                }}
                className="rounded-xl px-6 py-3 font-medium text-slate-600 transition-colors hover:bg-black/[0.04] dark:text-gray-300 dark:hover:bg-white/5"
              >
                Try Again
              </button>
              <button 
                onClick={() => { onClose(); onSuccess(); }}
                className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-green-500/20"
              >
                Continue Course
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
