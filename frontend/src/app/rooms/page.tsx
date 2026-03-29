'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, ShieldCheck, Camera, MicOff, Info, ArrowRight } from 'lucide-react';
import { useStudyRoom } from '@/components/providers/StudyRoomProvider';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

const DECORUM_RULES = [
  { icon: MicOff, text: "Microphones are compulsorily muted to ensure a silent, deep-work environment." },
  { icon: Camera, text: "Cameras should remain on to promote social accountability and presence." },
  { icon: Users, text: "Respect the space—this is a shared room for focused learning only." },
  { icon: ShieldCheck, text: "Decorum must be maintained. Any disruptive behavior will result in a ban." },
];

export default function StudyLoungePage() {
  const [isJoining, setIsJoining] = useState(false);
  const { joinRoom } = useStudyRoom();
  const router = useRouter();

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      // Mock room ID for now: 'main-lounge'
      const roomId = 'main-lounge';
      const { token } = await api<{ token: string }>(`/rooms/webrtc/token?room=${roomId}`);
      joinRoom(roomId, token);
      router.push(`/rooms/${roomId}`);
    } catch (error: unknown) {
      console.error('Failed to join room:', error);
      const status = typeof error === 'object' && error && 'status' in error
        ? Number((error as { status?: number }).status)
        : undefined;

      if (status === 401) {
        alert('Your session has expired. Please log in again.');
        localStorage.removeItem('sp_token');
        router.push('/login');
      } else if (status === 503) {
        alert('Study rooms are temporarily unavailable. Please ask admin to enable LiveKit in backend.');
      } else {
        alert('Could not join the study room. Please try again.');
      }
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      {/* Header Section */}
      <section className="text-center space-y-4 pt-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-2 inline-flex items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-3"
        >
          <Users className="h-8 w-8 text-cyan-600 dark:text-cyan-300" />
        </motion.div>
        <h1 className="text-4xl font-bold tracking-tight text-[var(--foreground)]">Live Study Lounge</h1>
        <p className="mx-auto max-w-2xl text-lg text-[var(--muted)]">
          Deep work is better together. Join a silent study room, stay accountable with your camera, and master your goals.
        </p>
      </section>

      <div className="grid md:grid-cols-5 gap-8 items-start">
        {/* Rules & Decorum */}
        <section className="md:col-span-3 space-y-6">
          <div className="glass-panel space-y-6 rounded-3xl border border-[var(--border)] p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2">
                <Info className="h-5 w-5 text-amber-600 dark:text-amber-300" />
              </div>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Room Decorum</h2>
            </div>
            
            <div className="space-y-4">
              {DECORUM_RULES.map((rule, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-4 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 transition-colors hover:bg-slate-100/80 dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.05]"
                >
                  <rule.icon className="mt-0.5 h-5 w-5 shrink-0 text-slate-500 dark:text-zinc-400" />
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-zinc-300">{rule.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Join CTA */}
        <section className="md:col-span-2 space-y-6">
          <motion.div 
            whileHover={{ y: -4 }}
            className="glass-panel flex flex-col items-center space-y-6 rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-transparent p-8 text-center shadow-2xl shadow-cyan-500/10"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/20">
              <Camera className="h-8 w-8 text-cyan-600 dark:text-cyan-300" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-[var(--foreground)]">Ready to Focus?</h3>
              <p className="px-4 text-sm text-[var(--muted)]">
                Click join to open your camera and enter the global study lounge.
              </p>
            </div>

            <button
              onClick={handleJoin}
              disabled={isJoining}
              className="group relative inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-8 py-4 font-bold text-black shadow-lg shadow-cyan-500/25 transition-all hover:bg-cyan-400 disabled:opacity-50"
            >
              {isJoining ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                  Connecting...
                </span>
              ) : (
                <>
                  Join Study Room
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
            
            <p className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted)]">
              12 Users Studying Currently
            </p>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
