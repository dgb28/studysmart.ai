"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Wand2 } from "lucide-react";
import SubjectCard from "@/components/SubjectCard";
import { getToken, api, isUnauthorized } from "@/lib/api";

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.06 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 380, damping: 28 },
  },
};

export default function DashboardPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [pathName, setPathName] = useState("");
  const [busy, setBusy] = useState(false);
  const [listErr, setListErr] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    setListErr(null);
    api<any[]>("/subjects/")
      .then(setSubjects)
      .catch((e) => {
        if (isUnauthorized(e)) router.replace("/login");
        else
          setListErr(
            "Could not load learning paths. API error or network — you are still logged in.",
          );
      });
  }, [router]);

  async function generatePath(e: React.FormEvent) {
    e.preventDefault();
    if (!pathName.trim() || busy) return;
    setBusy(true);
    try {
      await api("/learning/paths/generate", {
        method: "POST",
        json: { topic_name: pathName.trim() },
      });
      setPathName("");
      const list = await api<any[]>("/subjects/");
      setSubjects(list);
    } catch (err) {
      console.error(err);
      alert("Could not generate path (check OpenAI key)");
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div
      className="space-y-10"
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={fadeUp}>
        <div className="mb-2 flex items-center gap-2 text-cyan-600 dark:text-cyan-400/90">
          <Sparkles className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-[0.2em]">
            Orbit
          </span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          <span className="gradient-text">Learning</span>{" "}
          <span className="text-slate-900 dark:text-white">paths</span>
        </h1>
        <p className="mt-3 max-w-xl text-slate-600 dark:text-zinc-500">
          AI-generated paths · pick up anytime — progress stays saved.
        </p>
      </motion.div>

      {listErr && (
        <motion.div
          variants={fadeUp}
          className="rounded-[1.5rem] border border-amber-400/30 bg-amber-50/90 p-5 text-sm text-amber-900 glass-panel dark:border-amber-500/25 dark:bg-transparent dark:text-amber-200/90"
        >
          {listErr}
        </motion.div>
      )}

      <motion.form
        variants={fadeUp}
        onSubmit={generatePath}
        className="glass-panel rounded-[2rem] p-6 md:p-8 flex flex-col md:flex-row gap-4 items-stretch md:items-center"
      >
        <input
          className="input-orbit flex-1 min-w-0"
          placeholder="New topic — e.g. DBMS, Kubernetes, Linear Algebra…"
          value={pathName}
          onChange={(e) => setPathName(e.target.value)}
        />
        <motion.button
          type="submit"
          disabled={busy}
          whileHover={{ scale: busy ? 1 : 1.03 }}
          whileTap={{ scale: busy ? 1 : 0.97 }}
          className="rounded-full bg-gradient-to-r from-emerald-500/80 to-cyan-500/70 text-white font-semibold px-8 py-3.5 flex items-center justify-center gap-2 shadow-[0_0_28px_rgba(52,211,153,0.25)] disabled:opacity-40"
        >
          <Wand2 className="w-4 h-4" />
          Generate path
        </motion.button>
      </motion.form>

      {subjects.length === 0 ? (
        <motion.div
          variants={fadeUp}
          className="glass-panel rounded-[2rem] border border-dashed border-slate-300 p-12 text-center dark:border-white/10"
        >
          <p className="mb-2 text-slate-600 dark:text-zinc-500">
            No paths yet.
          </p>
          <p className="text-sm text-slate-500 dark:text-zinc-600">
            Use the form above to create your first path.
          </p>
        </motion.div>
      ) : (
        <motion.div
          variants={fadeUp}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
        >
          {subjects.map((subject: any, i: number) => (
            <motion.div
              key={subject.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: i * 0.06,
                type: "spring",
                stiffness: 300,
                damping: 24,
              }}
            >
              <SubjectCard subject={subject} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
