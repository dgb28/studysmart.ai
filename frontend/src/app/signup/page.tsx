"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus, Mail, Lock, User, GraduationCap } from "lucide-react";
import { setToken, api, formatApiError } from "@/lib/api";
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
      setErr(
        formatApiError(
          e,
          "Could not create account. Check your connection and try again.",
        ),
      );
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-6 transition-colors">
      <AnimatedBackdrop />
      <div className="absolute right-4 top-4 z-[50] md:right-8 md:top-8">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-8 glass-panel p-10 md:p-12">
        <div className="text-center relative">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400">
            <UserPlus className="h-8 w-8" strokeWidth={2} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Create an account
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Join StudyPulse
          </p>
        </div>

        {err && (
          <p className="text-red-500 text-sm font-medium text-center rounded-xl bg-red-50 dark:bg-red-500/10 dark:text-red-400 py-3 px-4">
            {err}
          </p>
        )}

        <form onSubmit={submit} className="space-y-6">
          <div className="space-y-4">
            <div className="relative group">
              <User className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <input
                className="input-orbit input-orbit--leading-icon w-full pl-12 h-12"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="relative group">
              <Mail className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <input
                className="input-orbit input-orbit--leading-icon w-full pl-12 h-12"
                placeholder="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative group">
              <Lock className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <input
                className="input-orbit input-orbit--leading-icon w-full pl-12 h-12"
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-glow w-full h-12 flex items-center justify-center gap-2"
          >
            Sign up
          </button>
        </form>

        <p className="text-center text-sm font-medium text-slate-500 dark:text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="text-emerald-600 dark:text-emerald-400 hover:underline transition-all ml-1">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
