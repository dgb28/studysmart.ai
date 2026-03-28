"use client";

import { useEffect, useState, useRef } from "react";
import { Mic, MicOff, MessageSquare, X, Maximize2, Minimize2, Loader2 } from "lucide-react";
import { useVoiceConversation } from "@/hooks/useVoiceConversation";

interface VoiceCoachProps {
  context?: Record<string, string>;
  onActiveChange?: (active: boolean) => void;
}

export default function VoiceCoach({ context, onActiveChange }: VoiceCoachProps) {
  const [agentId, setAgentId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const envAgentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
    if (envAgentId) {
      setAgentId(envAgentId);
    }
  }, []);

  const { 
    isActive, 
    status, 
    messages, 
    toggleConversation,
    setMessages
  } = useVoiceConversation({
    agentId: agentId || "",
    connectionType: 'public',
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
    }
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
        <div className="w-[350px] md:w-[450px] h-[500px] glass-panel rounded-3xl overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-300 border border-white/10 mb-4">
          {/* Header */}
          <div className="p-4 bg-blue-600/20 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="font-bold text-sm tracking-tight">AI VOICE COACH</span>
            </div>
            <button 
              onClick={() => setIsExpanded(false)}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
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
                <p className="text-gray-400 text-sm">
                  Conversation context loaded for:<br/>
                  <span className="text-blue-400 font-medium">"{context?.topic_title || 'Current Topic'}"</span>
                </p>
                <p className="text-xs text-gray-500 mt-2">Start talking to get explanations.</p>
              </div>
            ) : (
              messages.map((m) => (
                <div 
                  key={m.id}
                  className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-none'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))
            )}
            {status === 'connecting' && (
              <div className="flex items-center gap-2 text-xs text-blue-400 animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" />
                Connecting to AI...
              </div>
            )}
          </div>

          {/* Context Footer (Restricted Scope indicator) */}
          <div className="p-3 bg-black/20 border-t border-white/5 text-[10px] text-gray-500 uppercase tracking-widest text-center">
            Locked to: {context?.module_title || "Current Module"}
          </div>
        </div>
      )}

      {/* Floating Control Button */}
      <div className="flex items-center gap-3">
        {isActive && !isExpanded && (
          <button 
            onClick={() => setIsExpanded(true)}
            className="bg-white/5 hover:bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 transition-all animate-in zoom-in"
          >
            <Maximize2 className="w-5 h-5 text-gray-400" />
          </button>
        )}
        
        <button
          onClick={toggleConversation}
          className={`group relative p-5 rounded-2xl transition-all duration-500 shadow-xl flex items-center justify-center ${
            isActive 
              ? 'bg-red-500 shadow-red-500/40 hover:scale-105' 
              : 'bg-blue-600 shadow-blue-500/40 hover:scale-110'
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
          <span className="absolute right-full mr-4 px-3 py-1 bg-black/80 rounded-lg text-xs font-medium text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {isActive ? "Stop AI Session" : "Consult AI Coach"}
          </span>
        </button>
      </div>
    </div>
  );
}
