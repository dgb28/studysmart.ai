"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Mail, LogIn } from "lucide-react";
import { setToken, api } from "@/lib/api";
import { formatApiError } from "@/lib/apiErrors";
import { HOME_GREETING_FROM_REGISTER_KEY } from "@/lib/homeGreeting";
import AnimatedBackdrop from "@/components/AnimatedBackdrop";
import ThemeToggle from "@/components/ThemeToggle";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    try {
      const data = await api<{ access_token: string }>("/auth/login", {
        method: "POST",
        json: { email, password },
      });
      setToken(data.access_token);
      sessionStorage.removeItem(HOME_GREETING_FROM_REGISTER_KEY);
      router.push("/home");
    } catch (e) {
      setErr(formatApiError(e));
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--background)] p-6 transition-colors">
      <AnimatedBackdrop />
      <div className="noise-overlay z-[1]" aria-hidden />
      <div className="absolute right-4 top-4 z-[3] md:right-8 md:top-8">
        <ThemeToggle />
      </div>

      <motion.form
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 26 }}
        onSubmit={submit}
        className="relative z-[2] w-full max-w-md space-y-6 rounded-[2rem] border border-[var(--border)] glass-panel p-8 shadow-[0_0_60px_rgba(0,0,0,0.06)] dark:shadow-[0_0_80px_rgba(34,211,238,0.08)] md:p-10"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.1, stiffness: 400, damping: 18 }}
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/20 to-violet-600/25 ring-1 ring-[var(--border)] dark:from-cyan-500/25 dark:to-violet-600/35 dark:ring-white/10"
          >
            <LogIn className="h-7 w-7 text-cyan-700 dark:text-cyan-300" />
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Sign in</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-zinc-500">Enter the orbit</p>
        </div>

        {err && (
          <motion.p
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-red-400 text-sm text-center rounded-full bg-red-500/10 border border-red-500/20 py-2 px-4"
          >
            {err}
          </motion.p>
        )}

        <div className="space-y-4">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-zinc-500" />
            <input
              className="input-orbit input-orbit--leading-icon w-full"
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-zinc-500" />
            <input
              className="input-orbit input-orbit--leading-icon w-full"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <motion.button
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn-glow w-full flex items-center justify-center gap-2 py-3.5"
        >
          Continue
        </motion.button>

        <p className="text-center text-sm text-slate-600 dark:text-zinc-500">
          No account?{" "}
          <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-cyan-400 dark:hover:text-cyan-300">
            Create one
          </Link>
        </p>
      </motion.form>
    </div>
  );
}
