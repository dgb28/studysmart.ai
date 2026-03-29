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
    } catch (error: any) {
      console.error('Failed to join room:', error);
      if (error?.status === 401) {
        alert('Your session has expired. Please log in again.');
        localStorage.removeItem('sp_token');
        router.push('/login');
      } else {
        alert('Could not join the study room. Please try again.');
      }
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header Section */}
      <section className="text-center space-y-4 pt-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center justify-center p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 mb-2"
        >
          <Users className="w-8 h-8 text-cyan-400" />
        </motion.div>
        <h1 className="text-4xl font-bold tracking-tight text-white">Live Study Lounge</h1>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
          Deep work is better together. Join a silent study room, stay accountable with your camera, and master your goals.
        </p>
      </section>

      <div className="grid md:grid-cols-5 gap-8 items-start">
        {/* Rules & Decorum */}
        <section className="md:col-span-3 space-y-6">
          <div className="glass-panel p-6 rounded-3xl border-white/5 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Info className="w-5 h-5 text-amber-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">Room Decorum</h2>
            </div>
            
            <div className="space-y-4">
              {DECORUM_RULES.map((rule, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-4 items-start p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors"
                >
                  <rule.icon className="w-5 h-5 text-zinc-400 mt-0.5 shrink-0" />
                  <p className="text-zinc-300 text-sm leading-relaxed">{rule.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Join CTA */}
        <section className="md:col-span-2 space-y-6">
          <motion.div 
            whileHover={{ y: -4 }}
            className="glass-panel p-8 rounded-3xl border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-transparent flex flex-col items-center text-center space-y-6 shadow-2xl shadow-cyan-500/5"
          >
            <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
              <Camera className="w-8 h-8 text-cyan-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white">Ready to Focus?</h3>
              <p className="text-zinc-400 text-sm px-4">
                Click join to open your camera and enter the global study lounge.
              </p>
            </div>

            <button
              onClick={handleJoin}
              disabled={isJoining}
              className="w-full group relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-2xl transition-all shadow-lg shadow-cyan-500/25 disabled:opacity-50"
            >
              {isJoining ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Connecting...
                </span>
              ) : (
                <>
                  Join Study Room
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
            
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">
              12 Users Studying Currently
            </p>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
