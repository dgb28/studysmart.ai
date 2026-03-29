"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Wand2, FolderGit2 } from "lucide-react";
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
      className="space-y-12"
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={fadeUp}>
        <div className="mb-3 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
          <Sparkles className="h-5 w-5" />
          <span className="text-sm font-semibold uppercase tracking-wider">
            Dashboard
          </span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl text-[var(--foreground)]">
          Learning Paths
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-[var(--muted)]">
          AI-generated paths · pick up anytime — progress stays saved.
        </p>
      </motion.div>

      {listErr && (
        <motion.div
          variants={fadeUp}
          className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm font-medium text-red-600 shadow-sm dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
        >
          {listErr}
        </motion.div>
      )}

      <motion.form
        variants={fadeUp}
        onSubmit={generatePath}
        className="glass-panel p-6 md:p-8 flex flex-col md:flex-row gap-4 items-stretch md:items-center"
      >
        <div className="flex-1 relative">
          <input
            className="input-orbit w-full h-14"
            placeholder="New topic — e.g. Kubernetes, Linear Algebra..."
            value={pathName}
            onChange={(e) => setPathName(e.target.value)}
          />
        </div>
        <motion.button
          type="submit"
          disabled={busy}
          whileHover={{ scale: busy ? 1 : 1.02 }}
          whileTap={{ scale: busy ? 1 : 0.98 }}
          className="btn-glow h-14 shrink-0 px-8"
        >
          <Wand2 className="w-4 h-4 mr-2" />
          Generate Path
        </motion.button>
      </motion.form>

      {subjects.length === 0 ? (
        <motion.div
          variants={fadeUp}
          className="glass-panel border-dashed p-16 text-center shadow-none"
        >
          <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400">
            <FolderGit2 className="w-8 h-8 opacity-50" />
          </div>
          <p className="mb-2 text-xl font-bold text-[var(--foreground)]">
            No paths yet
          </p>
          <p className="text-[var(--muted)]">
            Use the form above to create your first learning path.
          </p>
        </motion.div>
      ) : (
        <motion.div
          variants={fadeUp}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {subjects.map((subject: any, i: number) => (
            <motion.div
              key={subject.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, type: "spring", stiffness: 300, damping: 24 }}
            >
              <SubjectCard subject={subject} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
