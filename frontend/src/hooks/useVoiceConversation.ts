import { useCallback, useEffect, useRef, useState } from 'react';
import { Conversation } from '@elevenlabs/client';

export interface Message {
  role: 'user' | 'agent';
  text: string;
  id: string;
}

export interface UseVoiceConversationProps {
  agentId: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: string) => void;
  dynamicVariables?: Record<string, string>;
  connectionType?: 'public' | 'signedUrl';
}

export function useVoiceConversation({
  agentId,
  onConnect,
  onDisconnect,
  onError,
  dynamicVariables,
}: UseVoiceConversationProps) {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const [messages, setMessages] = useState<Message[]>([]);
  const conversationRef = useRef<any>(null);

  const startConversation = useCallback(async () => {
    try {
      setStatus('connecting');
      
      // Request microphone access
      await navigator.mediaDevices.getUserMedia({ audio: true });

      conversationRef.current = await Conversation.startSession({
        agentId,
        dynamicVariables,
        onConnect: () => {
          setIsActive(true);
          setStatus('connected');
          onConnect?.();
        },
        onDisconnect: () => {
          setIsActive(false);
          setStatus('disconnected');
          onDisconnect?.();
        },
        onError: (error) => {
          console.error('ElevenLabs Error:', error);
          onError?.(typeof error === 'string' ? error : 'Conversation error');
        },
        onMessage: (props: { message: string, source: string }) => {
          setMessages((prev) => [
            ...prev,
            {
              role: props.source === 'user' ? 'user' : 'agent',
              text: props.message,
              id: Math.random().toString(36).substring(7),
            },
          ]);
        },
      });
    } catch (err) {
      console.error('Failed to start conversation:', err);
      setStatus('disconnected');
      onError?.(err instanceof Error ? err.message : 'Failed to start conversation');
    }
  }, [agentId, dynamicVariables, onConnect, onDisconnect, onError]);

  const stopConversation = useCallback(async () => {
    if (conversationRef.current) {
      await conversationRef.current.endSession();
      conversationRef.current = null;
    }
  }, []);

  const toggleConversation = useCallback(() => {
    if (isActive) {
      stopConversation();
    } else {
      startConversation();
    }
  }, [isActive, startConversation, stopConversation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (conversationRef.current) {
        conversationRef.current.endSession();
      }
    };
  }, []);

  return {
    isActive,
    status,
    messages,
    startConversation,
    stopConversation,
    toggleConversation,
    setMessages
  };
}
