import { useCallback, useEffect, useRef, useState } from "react";
import { Conversation } from "@elevenlabs/client";

export interface Message {
  role: "user" | "agent";
  text: string;
  id: string;
}

export interface UseVoiceConversationProps {
  agentId: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: string) => void;
  dynamicVariables?: Record<string, string>;
  connectionType?: "public" | "signedUrl";
}

/** Large lesson bodies break ConvAI dynamic variable limits — keep voice context bounded. */
const MAX_TOPIC_CONTENT_CHARS = 12_000;

/** Map ElevenLabs / LiveKit errors to clearer copy (quota is the common case). */
export function formatVoiceSessionError(raw: string): string {
  const m = raw.replace(/^Server error:\s*/i, "").trim();
  if (
    /quota limit|exceeds your quota|exceed.*quota|1002.*quota|protocol error.*quota/i.test(
      raw + m,
    )
  ) {
    return (
      "Voice session limit reached on your ElevenLabs account (quota). " +
      "Open elevenlabs.io → Billing / Usage to add credits or upgrade, then try again."
    );
  }
  return raw.startsWith("Server error:") ? raw : `Voice error: ${m}`;
}

function clampDynamicVariables(
  vars: Record<string, string> | undefined,
): Record<string, string> | undefined {
  if (!vars) return undefined;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(vars)) {
    if (k === "topic_content" && v.length > MAX_TOPIC_CONTENT_CHARS) {
      out[k] =
        v.slice(0, MAX_TOPIC_CONTENT_CHARS) + "\n… [truncated for voice coach]";
    } else {
      out[k] = v;
    }
  }
  return out;
}

export function useVoiceConversation({
  agentId,
  onConnect,
  onDisconnect,
  onError,
  dynamicVariables,
}: UseVoiceConversationProps) {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<
    "connected" | "connecting" | "disconnected"
  >("disconnected");
  const [messages, setMessages] = useState<Message[]>([]);
  const conversationRef = useRef<unknown>(null);

  const startConversation = useCallback(async () => {
    try {
      setStatus("connecting");

      await navigator.mediaDevices.getUserMedia({ audio: true });

      const clamped = clampDynamicVariables(dynamicVariables);

      let conversationToken: string | undefined;
      try {
        const r = await fetch(
          `/api/convai/token?agent_id=${encodeURIComponent(agentId)}`,
        );
        if (r.ok) {
          const j = (await r.json()) as { token?: string };
          if (typeof j.token === "string" && j.token.length > 0) {
            conversationToken = j.token;
          }
        } else {
          const err = (await r.json().catch(() => null)) as {
            error?: string;
            detail?: string;
          } | null;
          console.warn(
            "ConvAI token route failed:",
            r.status,
            err?.error,
            err?.detail,
          );
        }
      } catch (e) {
        console.warn("ConvAI token fetch failed, using client fallback", e);
      }

      const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY?.trim();

      const shared = {
        dynamicVariables: clamped,
        onConnect: () => {
          setIsActive(true);
          setStatus("connected");
          onConnect?.();
        },
        onDisconnect: () => {
          setIsActive(false);
          setStatus("disconnected");
          onDisconnect?.();
        },
        onError: (message: string, context: unknown) => {
          console.error("ElevenLabs Error:", message, context);
          const text =
            typeof message === "string"
              ? formatVoiceSessionError(message)
              : "Conversation error";
          onError?.(text);
        },
        onMessage: (props: { message: string; source: string }) => {
          setMessages((prev) => [
            ...prev,
            {
              role: props.source === "user" ? "user" : "agent",
              text: props.message,
              id: Math.random().toString(36).substring(7),
            },
          ]);
        },
      };

      if (conversationToken) {
        conversationRef.current = await Conversation.startSession({
          conversationToken,
          ...shared,
        });
      } else {
        conversationRef.current = await Conversation.startSession({
          agentId,
          ...(apiKey ? { authorization: apiKey } : {}),
          ...shared,
        });
      }
    } catch (err) {
      console.error("Failed to start conversation:", err);
      setStatus("disconnected");
      onError?.(
        err instanceof Error ? err.message : "Failed to start conversation",
      );
    }
  }, [agentId, dynamicVariables, onConnect, onDisconnect, onError]);

  const stopConversation = useCallback(async () => {
    const conv = conversationRef.current as {
      endSession?: () => Promise<void>;
    } | null;
    if (conv?.endSession) {
      await conv.endSession();
      conversationRef.current = null;
    }
  }, []);

  const toggleConversation = useCallback(() => {
    if (isActive) {
      void stopConversation();
    } else {
      void startConversation();
    }
  }, [isActive, startConversation, stopConversation]);

  useEffect(() => {
    return () => {
      const conv = conversationRef.current as {
        endSession?: () => void;
      } | null;
      void conv?.endSession?.();
    };
  }, []);

  return {
    isActive,
    status,
    messages,
    startConversation,
    stopConversation,
    toggleConversation,
    setMessages,
  };
}
