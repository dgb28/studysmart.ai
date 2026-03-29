'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface StudyRoomState {
  isInRoom: boolean;
  roomId: string | null;
  token: string | null;
  isFloating: boolean;
  joinRoom: (roomId: string, token: string) => void;
  leaveRoom: () => void;
}

const StudyRoomContext = createContext<StudyRoomState | undefined>(undefined);

export function StudyRoomProvider({ children }: { children: React.ReactNode }) {
  const [isInRoom, setIsInRoom] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const pathname = usePathname();

  // Floating logic: If in room AND not on the room page itself, show floating
  const isFloating = isInRoom && !pathname.startsWith('/rooms/');

  const joinRoom = useCallback((id: string, t: string) => {
    setRoomId(id);
    setToken(t);
    setIsInRoom(true);
  }, []);

  const leaveRoom = useCallback(() => {
    setRoomId(null);
    setToken(null);
    setIsInRoom(false);
  }, []);

  return (
    <StudyRoomContext.Provider value={{ isInRoom, roomId, token, isFloating, joinRoom, leaveRoom }}>
      {children}
    </StudyRoomContext.Provider>
  );
}

export function useStudyRoom() {
  const context = useContext(StudyRoomContext);
  if (context === undefined) {
    throw new Error('useStudyRoom must be used within a StudyRoomProvider');
  }
  return context;
}
