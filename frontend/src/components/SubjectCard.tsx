"use client";

import Link from "next/link";
import { FolderGit2, BookOpen, Sparkles } from "lucide-react";

export default function SubjectCard({ subject }: { subject: any }) {
  const isDemo = subject.id === "demo";

  const modules: any[] = Array.isArray(subject.modules) ? subject.modules : [];
  const totalModules = modules.length;

  return (
    <Link href={`/dashboard/${subject.id}`} className="block h-full group">
      <div className="glass-panel h-full w-full p-6 flex flex-col hover:bg-[var(--card-hover)] transition-all">
        {/* Header Icon & Title */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 group-hover:scale-110 transition-transform">
            <FolderGit2 className="h-6 w-6" />
          </div>
          {isDemo && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-2.5 py-1 text-xs font-semibold dark:bg-emerald-500/10 dark:text-emerald-400">
              <Sparkles className="h-3 w-3" /> DEMO
            </span>
          )}
        </div>

        <h3 className="mb-2 text-xl font-bold tracking-tight text-[var(--foreground)]">
          {subject.name}
        </h3>

        <p className="text-sm text-[var(--muted)] flex-1">
          {subject.description || subject.goal || "AI-generated learning path."}
        </p>

        {/* Footer Meta — real data only */}
        <div className="mt-6 flex items-center justify-between border-t border-[var(--border)] pt-4 text-xs font-medium text-[var(--muted)]">
          <div className="flex items-center gap-1.5">
            <BookOpen className="h-4 w-4" />
            <span>
              {totalModules > 0
                ? `${totalModules} module${totalModules !== 1 ? "s" : ""}`
                : "No modules yet"}
            </span>
          </div>
          <span className="text-[var(--muted)] italic">
            {totalModules === 0 ? "Not started" : "Tap to explore →"}
          </span>
        </div>
      </div>
    </Link>
  );
}
