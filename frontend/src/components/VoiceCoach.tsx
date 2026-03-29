"use client";

import { useEffect, useState, useRef } from "react";
import {
  Mic,
  MicOff,
  MessageSquare,
  X,
  Maximize2,
  Minimize2,
  Loader2,
} from "lucide-react";
import { useVoiceConversation } from "@/hooks/useVoiceConversation";

interface VoiceCoachProps {
  context?: Record<string, string>;
  onActiveChange?: (active: boolean) => void;
}

export default function VoiceCoach({
  context,
  onActiveChange,
}: VoiceCoachProps) {
  const [agentId, setAgentId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const envAgentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
    if (envAgentId) {
      setAgentId(envAgentId);
    }
  }, []);

  const { isActive, status, messages, toggleConversation, setMessages } =
    useVoiceConversation({
      agentId: agentId || "",
      connectionType: "public",
      dynamicVariables: context,
      onConnect: () => {
        setIsExpanded(true);
        onActiveChange?.(true);
      },
      onDisconnect: () => {
        onActiveChange?.(false);
      },
      onError: (err) => {
        alert(err);
        onActiveChange?.(false);
      },
    });

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!agentId) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Expanded Chat Panel */}
      {isExpanded && (
        <div className="mb-4 flex h-[500px] w-[350px] flex-col overflow-hidden rounded-3xl border border-black/10 glass-panel animate-in slide-in-from-bottom-10 fade-in duration-300 shadow-2xl dark:border-white/10 md:w-[450px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-black/5 bg-blue-600/15 p-4 dark:border-white/5 dark:bg-blue-600/20">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
              <span className="text-sm font-bold tracking-tight text-slate-800 dark:text-white">
                AI VOICE COACH
              </span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="rounded-lg p-1 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
            >
              <X className="h-4 w-4 text-slate-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Messages Area */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide"
          >
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-blue-400 opacity-50" />
                </div>
                <p className="text-sm text-slate-600 dark:text-gray-400">
                  Conversation context loaded for:
                  <br />
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    &quot;{context?.topic_title || "Current Topic"}&quot;
                  </span>
                </p>
                <p className="mt-2 text-xs text-slate-500 dark:text-gray-500">
                  Start talking to get explanations.
                </p>
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "rounded-tr-none bg-blue-600 text-white"
                        : "rounded-tl-none border border-[var(--border)] bg-slate-100 text-slate-800 dark:border-white/10 dark:bg-white/5 dark:text-gray-200"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))
            )}
            {status === "connecting" && (
              <div className="flex items-center gap-2 text-xs text-blue-400 animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" />
                Connecting to AI...
              </div>
            )}
          </div>

          {/* Context Footer (Restricted Scope indicator) */}
          <div className="border-t border-black/5 bg-slate-100/80 p-3 text-center text-[10px] uppercase tracking-widest text-slate-500 dark:border-white/5 dark:bg-black/20 dark:text-gray-500">
            Locked to: {context?.module_title || "Current Module"}
          </div>
        </div>
      )}

      {/* Floating Control Button */}
      <div className="flex items-center gap-3">
        {isActive && !isExpanded && (
          <button
            onClick={() => setIsExpanded(true)}
            className="animate-in zoom-in rounded-2xl border border-black/10 bg-black/[0.03] p-3 backdrop-blur-md transition-all hover:bg-black/[0.06] dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
          >
            <Maximize2 className="h-5 w-5 text-slate-500 dark:text-gray-400" />
          </button>
        )}

        <button
          onClick={toggleConversation}
          className={`group relative p-5 rounded-2xl transition-all duration-500 shadow-xl flex items-center justify-center ${
            isActive
              ? "bg-red-500 shadow-red-500/40 hover:scale-105"
              : "bg-blue-600 shadow-blue-500/40 hover:scale-110"
          }`}
        >
          {isActive ? (
            <>
              <div className="absolute inset-0 rounded-2xl bg-red-400 animate-ping opacity-20" />
              <MicOff className="w-6 h-6 text-white relative z-10" />
            </>
          ) : (
            <Mic className="w-6 h-6 text-white group-hover:animate-pulse" />
          )}

          {/* Tooltip */}
          <span className="pointer-events-none absolute right-full mr-4 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 dark:bg-black/80">
            {isActive ? "Stop AI Session" : "Consult AI Coach"}
          </span>
        </button>
      </div>
    </div>
  );
}
