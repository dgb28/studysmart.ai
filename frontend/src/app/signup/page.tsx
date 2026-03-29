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
    <div className="relative flex min-h-screen items-center justify-center overflow-x-hidden overflow-y-auto p-6 py-10 transition-colors">
      <AnimatedBackdrop />
      <div className="absolute right-4 top-4 z-[50] md:right-8 md:top-8">
        <ThemeToggle />
      </div>

      <div className="relative z-20 w-full max-w-md space-y-6 rounded-3xl border border-emerald-500/20 bg-slate-950/80 p-8 shadow-2xl shadow-emerald-900/20 backdrop-blur pointer-events-auto md:p-9">
        <div className="text-center relative">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400">
            <UserPlus className="h-8 w-8" strokeWidth={2} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Create an account
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Join StudyPulse
          </p>
        </div>

        {err && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-sm font-medium text-red-300">
            {err}
          </p>
        )}

        <form id="signup-form" onSubmit={submit} className="relative z-30 space-y-4 pointer-events-auto">
          <div className="space-y-3">
            <div className="relative group">
              <User className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <input
                className="input-orbit input-orbit--leading-icon h-12 w-full pl-12 pointer-events-auto"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="relative group">
              <Mail className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <input
                className="input-orbit input-orbit--leading-icon h-12 w-full pl-12 pointer-events-auto"
                placeholder="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative group">
              <Lock className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <input
                className="input-orbit input-orbit--leading-icon h-12 w-full pl-12 pointer-events-auto"
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl font-semibold pointer-events-auto"
            style={{
              backgroundColor: "#10b981",
              color: "#ffffff",
              border: "1px solid rgba(16,185,129,0.95)",
              boxShadow: "0 8px 22px rgba(16,185,129,0.35)",
            }}
          >
            Sign up
          </button>
        </form>

        <div className="relative z-30 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-center text-sm font-medium text-emerald-100 pointer-events-auto">
          <span>Already have an account?</span>{" "}
          <Link
            href="/login"
            className="cursor-pointer font-semibold underline decoration-emerald-300/60 underline-offset-4 hover:text-white"
            style={{
              color: "#d1fae5",
            }}
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
