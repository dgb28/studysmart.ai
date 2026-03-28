"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Database, Binary, BookOpen, Sparkles, LucideIcon } from "lucide-react";

interface Subject {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  description: string | null;
}

const ICON_MAP: Record<string, LucideIcon> = {
  Database: Database,
  Binary: Binary,
  BookOpen: BookOpen,
  Sparkles: Sparkles,
};

export default function SubjectCard({ subject }: { subject: Subject }) {
  const IconComponent = subject.icon && ICON_MAP[subject.icon] ? ICON_MAP[subject.icon] : BookOpen;

  return (
    <Link href={`/dashboard/${subject.id}`} className="block group h-full">
      <motion.div
        layout
        whileHover={{ y: -6, transition: { type: "spring", stiffness: 300, damping: 22 } }}
        whileTap={{ scale: 0.98 }}
        className="glass-panel rounded-[2rem] p-7 h-full flex flex-col gap-5 relative overflow-hidden min-h-[220px]"
      >
        <motion.div
          className="absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl opacity-40 group-hover:opacity-70 bg-gradient-to-br from-cyan-500/35 via-violet-500/25 to-fuchsia-600/30"
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-white/15 to-white/5 ring-1 ring-white/10 shadow-lg">
          <IconComponent className="w-7 h-7 text-cyan-200" />
        </div>

        <div className="relative">
          <h3 className="text-xl font-bold mb-2 text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-300 group-hover:to-violet-300 transition-all">
            {subject.name}
          </h3>
          <p className="text-sm text-zinc-500 line-clamp-2 leading-relaxed">
            {subject.description || "Start learning this subject to build your skills."}
          </p>
        </div>

        <div className="relative mt-auto flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-500 group-hover:text-zinc-300 transition-colors rounded-full glass-pill px-3 py-1">
            Open modules
          </span>
          <motion.span
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/30 to-violet-600/40 text-white text-lg"
            whileHover={{ rotate: -12, scale: 1.1 }}
          >
            →
          </motion.span>
        </div>
      </motion.div>
    </Link>
  );
}
