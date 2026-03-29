"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { UserPlus, Mail, Lock, User } from "lucide-react";
import { setToken, api } from "@/lib/api";
import { formatApiError } from "@/lib/apiErrors";
import { HOME_GREETING_FROM_REGISTER_KEY } from "@/lib/homeGreeting";
import AnimatedBackdrop from "@/components/AnimatedBackdrop";
import ThemeToggle from "@/components/ThemeToggle";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    try {
      const data = await api<{ access_token: string }>("/auth/signup", {
        method: "POST",
        json: { email, password, full_name: fullName || undefined },
      });
      setToken(data.access_token);
      sessionStorage.setItem(HOME_GREETING_FROM_REGISTER_KEY, "1");
      router.push("/home");
    } catch (e) {
      const msg = formatApiError(e);
      setErr(
        msg.includes("already registered") || msg.includes("Email already")
          ? "That email is already registered — try signing in."
          : msg
      );
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
        className="relative z-[2] w-full max-w-md space-y-6 rounded-[2rem] border border-[var(--border)] glass-panel p-8 shadow-[0_0_60px_rgba(0,0,0,0.06)] dark:shadow-[0_0_80px_rgba(167,139,250,0.1)] md:p-10"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.1, stiffness: 400, damping: 18 }}
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-600/25 ring-1 ring-[var(--border)] dark:from-violet-500/25 dark:to-fuchsia-600/35 dark:ring-white/10"
          >
            <UserPlus className="h-7 w-7 text-violet-700 dark:text-violet-300" />
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Create account</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-zinc-500">Join StudyPulse</p>
        </div>

        {err && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 text-sm text-center rounded-full bg-red-500/10 border border-red-500/20 py-2 px-4"
          >
            {err}
          </motion.p>
        )}

        <div className="space-y-4">
          <div className="relative">
            <User className="pointer-events-none absolute left-4 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-zinc-500" />
            <input
              className="input-orbit input-orbit--leading-icon w-full"
              placeholder="Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
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
          className="btn-glow w-full py-3.5"
        >
          Sign up
        </motion.button>

        <p className="text-center text-sm text-slate-600 dark:text-zinc-500">
          Have an account?{" "}
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-violet-400 dark:hover:text-violet-300">
            Sign in
          </Link>
        </p>
      </motion.form>
    </div>
  );
}
