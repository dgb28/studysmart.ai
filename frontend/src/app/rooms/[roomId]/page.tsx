'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStudyRoom } from '@/components/providers/StudyRoomProvider';
import { 
  LiveKitRoom, 
  RoomAudioRenderer,
  GridLayout,
  ParticipantTile,
  useTracks,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { ArrowLeft, Users, ShieldAlert, Camera, Loader2 } from 'lucide-react';
import Link from 'next/link';

// Essential styles for LiveKit components
import '@livekit/components-styles';

// --- The Custom Styled Grid ---
function CustomStudyGrid() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  if (tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-zinc-500 h-full gap-4">
        <Loader2 className="w-10 h-10 font-bold animate-spin text-cyan-500/50" />
        <p className="text-sm font-medium uppercase tracking-widest text-zinc-400">Waiting for others to join...</p>
      </div>
    );
  }

  return (
    <GridLayout tracks={tracks} style={{ height: '100%', width: '100%' }}>
      <ParticipantTile />
    </GridLayout>
  );
}


export default function LiveRoomPage() {
  const { roomId } = useParams();
  const { isInRoom, token, leaveRoom } = useStudyRoom();
  const router = useRouter();
  const [hasPermissions, setHasPermissions] = useState<boolean | null>(null);
  const [permError, setPermError] = useState<string | null>(null);

  // 1. Force explicit permission popup
  useEffect(() => {
    async function requestPermissions() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        // Stop the temporary stream right away; LiveKit uses its own when connected
        stream.getTracks().forEach(track => track.stop());
        setHasPermissions(true);
      } catch (err: any) {
        console.error('Camera permission error:', err);
        setPermError('Camera access was denied or not found. You must allow camera access to join the study room.');
        setHasPermissions(false);
      }
    }
    requestPermissions();
  }, []);

  // 2. Redirect if abandoned
  useEffect(() => {
    if (!isInRoom || !token) {
      router.replace('/rooms');
    }
  }, [isInRoom, token, router]);


  if (!isInRoom || !token) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col font-sans">
      {/* Room Header Overlay */}
      <div className="absolute top-0 inset-x-0 z-20 p-6 flex justify-between items-center bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          <Link 
            href="/rooms"
            className="p-3 rounded-full bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all border border-white/10"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-white flex items-center gap-2 tracking-tight">
              <Users className="w-5 h-5 text-cyan-400" />
              Global Study Lounge
            </h1>
            <p className="text-[11px] text-zinc-400 font-semibold tracking-[0.15em] uppercase">
              Deep Work Mode • Silent Room
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 pointer-events-auto">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 backdrop-blur-md">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-bold text-amber-300 tracking-wider uppercase font-mono">
              Mics Forced Mute
            </span>
          </div>
        </div>
      </div>

      {/* Permission Fallback UI */}
      {hasPermissions === false && (
        <div className="flex-1 flex items-center justify-center bg-zinc-950">
          <div className="max-w-md p-8 rounded-3xl bg-zinc-900 border border-zinc-800 text-center space-y-6">
             <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 mx-auto flex items-center justify-center">
                <Camera className="text-red-400 w-8 h-8" />
             </div>
             <div>
                <h2 className="text-xl font-bold text-white mb-2">Camera Required</h2>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {permError || "Waiting for camera permissions. Check your browser's address bar to allow access."}
                </p>
             </div>
             <button 
               onClick={() => router.push('/rooms')}
               className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-colors pointer-events-auto"
             >
               Return to Lobby
             </button>
          </div>
        </div>
      )}

      {/* Main Video Grid */}
      {hasPermissions === true && (
        <div className="flex-1 relative overflow-hidden bg-black p-4 pt-24 pb-16">
          <LiveKitRoom
            video={true}
            audio={false}
            token={token}
            serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
            connect={true}
            className="h-full w-full rounded-3xl overflow-hidden glass-panel border border-white/5"
          >
            <CustomStudyGrid />
            <RoomAudioRenderer />
          </LiveKitRoom>
        </div>
      )}

      {/* Minimal Footer */}
      <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex justify-center pointer-events-none">
        <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">
          Stay Focused • Your Future Starts Here
        </span>
      </div>

      {/* Leave Room — bottom-right, always visible */}
      <div className="absolute bottom-6 right-6 z-30 pointer-events-auto">
        <button
          onClick={() => {
            leaveRoom();
            router.push('/rooms');
          }}
          className="px-6 py-2.5 rounded-full bg-red-500/90 hover:bg-red-500 text-white font-bold text-sm transition-all shadow-lg shadow-red-500/20 hover:scale-105 active:scale-95 backdrop-blur-md"
        >
          Leave Room
        </button>
      </div>
    </div>
  );
}
