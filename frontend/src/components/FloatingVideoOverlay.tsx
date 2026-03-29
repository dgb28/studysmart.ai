'use client';

import React from 'react';
import { useStudyRoom } from '@/components/providers/StudyRoomProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { LiveKitRoom, RoomAudioRenderer, GridLayout, ParticipantTile, useTracks } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { X, Maximize2 } from 'lucide-react';
import Link from 'next/link';

function MiniGrid() {
  const tracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }],
    { onlySubscribed: false }
  );
  return (
    <GridLayout tracks={tracks} style={{ height: '100%', width: '100%' }}>
      <ParticipantTile />
    </GridLayout>
  );
}

export default function FloatingVideoOverlay() {
  const { isInRoom, roomId, token, isFloating, leaveRoom } = useStudyRoom();

  if (!isInRoom || !token || !isFloating) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, x: -20 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.9, x: -20 }}
        className="fixed top-24 left-6 z-[60] w-64 aspect-video rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden group"
      >
        <LiveKitRoom
          video={true}
          audio={false}
          token={token}
          serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
          connect={true}
          className="h-full w-full"
        >
          {/* Minimalist view of the room */}
          <div className="relative h-full w-full">
            <MiniGrid />
            
            {/* Overlay Controls */}
            <div className="absolute inset-x-0 top-0 p-2 flex justify-between items-start opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-b from-black/60 to-transparent">
              <span className="text-[10px] font-medium text-white/70 px-2 py-0.5 rounded-full bg-black/40">
                Live Room
              </span>
              <div className="flex gap-1">
                <Link 
                  href={`/rooms/${roomId}`}
                  className="p-1 rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <Maximize2 className="w-3 h-3" />
                </Link>
                <button 
                  onClick={leaveRoom}
                  className="p-1 rounded-md bg-red-500/20 hover:bg-red-500/40 text-red-200 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
          <RoomAudioRenderer />
        </LiveKitRoom>
      </motion.div>
    </AnimatePresence>
  );
}
