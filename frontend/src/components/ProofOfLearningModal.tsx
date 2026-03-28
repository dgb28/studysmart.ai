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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
      <div className="glass-panel w-full max-w-2xl rounded-3xl p-8 border-blue-500/30 shadow-[0_0_50px_rgba(59,130,246,0.15)] flex flex-col max-h-[90vh]">
        
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              Proof of Learning
            </h2>
            <p className="text-gray-400 text-sm">Explain what you learned to unlock the next topic.</p>
          </div>
        </div>

        {!result ? (
          <>
            <div className="mb-6 p-6 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
              <p className="text-lg font-medium text-white">
                "In your own words, briefly explain the concept of <span className="text-blue-400">'{topicTitle}'</span> in 2-3 sentences."
              </p>
            </div>

            <textarea 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Start typing your explanation here..."
              className="w-full h-32 bg-black/50 border border-gray-700 focus:border-blue-500 rounded-2xl p-4 text-white placeholder-gray-500 outline-none resize-none transition-colors mb-4"
              disabled={loading}
            />

            <div className="flex justify-between items-center mt-auto">
              {/* Optional: Add voice dictation UI here. We rely on ElevenLabs coach for purely conversational mode, 
                  but can put a mic button here for Speech-to-Text if needed. */}
              <button className="text-gray-400 hover:text-white flex items-center gap-2 px-4 py-2 rounded-xl transition-colors">
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
                <div className="text-xs text-gray-400 uppercase tracking-wider">Correctness</div>
              </div>
              <div className="glass-panel p-4 rounded-2xl border-blue-500/20 text-center">
                <div className="text-3xl font-bold text-blue-400 mb-1">{result.clarity}%</div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">Clarity</div>
              </div>
            </div>

            {result.gaps.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-red-400 font-semibold flex items-center gap-2"><XCircle className="w-4 h-4"/> Knowledge Gaps</h3>
                <ul className="list-disc pl-5 text-gray-300 space-y-1">
                  {result.gaps.map((gap, i) => <li key={i}>{gap}</li>)}
                </ul>
              </div>
            )}

            {result.recommendations.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-purple-400 font-semibold flex items-center gap-2"><CheckCircle className="w-4 h-4"/> Recommendations</h3>
                <ul className="list-disc pl-5 text-gray-300 space-y-1">
                  {result.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                </ul>
              </div>
            )}

            <div className="pt-6 mt-6 border-t border-white/10 flex justify-end gap-3">
              <button onClick={() => {setResult(null); setInputText("");}} className="px-6 py-3 rounded-xl text-gray-300 hover:bg-white/5 font-medium transition-colors">
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
