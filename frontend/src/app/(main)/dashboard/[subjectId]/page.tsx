"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, PlayCircle } from "lucide-react";
import { getToken, api, isUnauthorized } from "@/lib/api";

export default function SubjectPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params.subjectId as string;
  const [subject, setSubject] = useState<any | undefined>(undefined);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    api(`/subjects/${subjectId}`)
      .then(setSubject)
      .catch((e) => {
        if (isUnauthorized(e)) router.replace("/login");
        else setSubject(null);
      });
  }, [subjectId, router]);

  if (subject === undefined)
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <motion.div
          className="h-10 w-10 rounded-full border-2 border-cyan-400/30 border-t-cyan-400"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  if (!subject)
    return (
      <div className="glass-panel rounded-[2rem] p-8 text-center text-red-400">
        Subject not found.
      </div>
    );

  return (
    <div className="space-y-10">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-full border border-black/[0.08] bg-black/[0.03] px-4 py-2 text-sm text-slate-600 transition hover:border-black/15 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400 dark:hover:border-white/20 dark:hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to paths
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <h1 className="mb-3 bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500 bg-clip-text text-4xl font-bold tracking-tight text-transparent dark:from-white dark:via-zinc-100 dark:to-zinc-400">
          {subject.name}
        </h1>
        <p className="max-w-3xl text-lg text-slate-600 dark:text-zinc-400">{subject.description}</p>
      </motion.div>

      <div className="space-y-5">
        <h2 className="border-b border-[var(--border)] pb-2 text-xl font-semibold text-slate-900 dark:text-white">
          Modules
        </h2>
        {subject.modules.length === 0 ? (
          <p className="italic text-slate-500 dark:text-zinc-500">No modules yet.</p>
        ) : (
          <div className="grid gap-4">
            {subject.modules.map((module: any, index: number) => {
              return (
                <motion.div
                  key={module.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.08 * index,
                    duration: 0.45,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                  whileHover={{
                    scale: 1.012,
                    y: -2,
                    transition: {
                      type: "spring",
                      stiffness: 260,
                      damping: 22,
                      mass: 0.55,
                    },
                  }}
                  className="rounded-[2rem] border border-black/[0.06] bg-black/[0.02] shadow-sm dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none"
                >
                  <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-3">
                        <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-bold text-cyan-700 dark:text-cyan-300">
                          Module {index + 1}
                        </span>
                        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{module.title}</h3>
                      </div>
                      <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">{module.description}</p>
                    </div>
                    <Link
                      href={`/dashboard/${subject.id}/${module.id}`}
                      onClick={() => {
                        try {
                          sessionStorage.setItem("sp_start_focus_on_arrive", "1");
                        } catch {
                          /* ignore */
                        }
                      }}
                      className="btn-glow inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-violet-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition hover:shadow-cyan-500/40"
                    >
                      <PlayCircle className="h-5 w-5" />
                      <span className="hidden sm:inline">Open</span>
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
