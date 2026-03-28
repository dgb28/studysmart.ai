"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { UserPlus, Mail, Lock, User } from "lucide-react";
import { setToken, api } from "@/lib/api";
import { HOME_GREETING_FROM_REGISTER_KEY } from "@/lib/homeGreeting";
import AnimatedBackdrop from "@/components/AnimatedBackdrop";

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
    } catch {
      setErr("Signup failed — email may already be registered.");
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 bg-[#050508] overflow-hidden">
      <AnimatedBackdrop />
      <div className="noise-overlay z-[1]" aria-hidden />

      <motion.form
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 26 }}
        onSubmit={submit}
        className="relative z-[2] glass-panel rounded-[2rem] p-8 md:p-10 w-full max-w-md space-y-6 border border-white/[0.08] shadow-[0_0_80px_rgba(167,139,250,0.1)]"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.1, stiffness: 400, damping: 18 }}
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/25 to-fuchsia-600/35 ring-1 ring-white/10"
          >
            <UserPlus className="w-7 h-7 text-violet-300" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Create account</h1>
          <p className="text-sm text-zinc-500 mt-2">Join StudyPulse</p>
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
            <User className="pointer-events-none absolute left-4 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              className="input-orbit input-orbit--leading-icon w-full"
              placeholder="Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              className="input-orbit input-orbit--leading-icon w-full"
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-zinc-500" />
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

        <p className="text-sm text-zinc-500 text-center">
          Have an account?{" "}
          <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium">
            Sign in
          </Link>
        </p>
      </motion.form>
    </div>
  );
}
