"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mic, Sparkles, ArrowRight } from "lucide-react";
import { getToken, api, isUnauthorized } from "@/lib/api";
import { HOME_GREETING_FROM_REGISTER_KEY } from "@/lib/homeGreeting";

type Me = { full_name: string | null; email: string };

export default function HomePage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [isSignupFlow, setIsSignupFlow] = useState(false);
  const [busy, setBusy] = useState(false);
  const registerGreetingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    api<Me>("/auth/me")
      .then(setMe)
      .catch((e) => {
        if (isUnauthorized(e)) router.replace("/login");
        else setLoadErr("Could not load profile. Check API is reachable.");
      });
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(HOME_GREETING_FROM_REGISTER_KEY) !== "1") return;
    setIsSignupFlow(true);
    registerGreetingTimeoutRef.current = setTimeout(() => {
      sessionStorage.removeItem(HOME_GREETING_FROM_REGISTER_KEY);
      registerGreetingTimeoutRef.current = null;
    }, 400);
    return () => {
      if (registerGreetingTimeoutRef.current) clearTimeout(registerGreetingTimeoutRef.current);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      const res = await api<{
        target: string;
        learning_topic: string | null;
        goal?: { id: string; title: string; target_date: string; completed: boolean } | null;
      }>("/learning/home/classify", {
        method: "POST",
        json: { text: text.trim() },
      });
      if (res.target === "daily_goals") {
        if (res.goal) {
          sessionStorage.setItem(
            "goals_flash",
            `Added “${res.goal.title}” for ${res.goal.target_date}`
          );
        }
        router.push("/dashboard/goals");
      } else if (res.target === "analysis") {
        router.push("/dashboard/analytics");
      } else {
        if (res.learning_topic && res.learning_topic.length > 1) {
          await api("/learning/paths/generate", {
            method: "POST",
            json: { topic_name: res.learning_topic },
          });
        }
        router.push("/dashboard");
      }
    } catch {
      router.push("/dashboard");
    } finally {
      setBusy(false);
    }
  }

  function startVoice() {
    type Rec = {
      lang: string;
      onresult: ((ev: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
      start: () => void;
    };
    type RecCtor = new () => Rec;
    const w = window as Window & {
      webkitSpeechRecognition?: RecCtor;
      SpeechRecognition?: RecCtor;
    };
    const SR = w.webkitSpeechRecognition ?? w.SpeechRecognition;
    if (!SR) {
      alert("Speech recognition not supported in this browser");
      return;
    }
    const rec = new SR();
    rec.lang = "en-US";
    rec.onresult = (ev: { results: ArrayLike<{ 0: { transcript: string } }> }) => {
      const t = ev.results[0][0].transcript;
      setText((prev) => (prev ? `${prev} ${t}` : t));
    };
    rec.start();
  }

  if (!me && !loadErr)
    return (
      <div className="flex min-h-[50vh] flex-1 items-center justify-center py-24">
        <div className="h-10 w-10 animate-pulse rounded-full bg-indigo-400/25 dark:bg-cyan-400/20" aria-hidden />
      </div>
    );
  if (loadErr)
    return (
      <div className="py-24 text-center text-amber-700 dark:text-amber-400">
        {loadErr}
      </div>
    );

  const name = me!.full_name || me!.email.split("@")[0];
  const eyebrow = isSignupFlow ? "NICE TO MEET YOU" : "WELCOME BACK";
  const question = isSignupFlow
    ? "What would you like to learn today?"
    : "What are you planning to study today?";

  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full flex-col items-center justify-center p-4">
      <div className="flex w-full max-w-3xl flex-col justify-center">
        <div className="mx-auto w-full glass-panel p-8 sm:p-12 text-center">
          
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <Sparkles className="h-8 w-8" strokeWidth={1.5} />
            </div>
          </div>

          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            {eyebrow}
          </p>
          
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl text-[var(--foreground)]">
            Hi, <span className="text-emerald-600 dark:text-emerald-400">{name}</span>
          </h1>
          
          <p className="mx-auto mt-4 max-w-xl text-lg text-[var(--muted)] sm:text-xl font-medium">
            {question}
          </p>

          <form
            onSubmit={handleSubmit}
            className="mx-auto mt-10 flex w-full max-w-2xl flex-col gap-4 sm:flex-row sm:items-stretch"
          >
            <div className="flex flex-1 items-center gap-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--input-border)] px-4 py-2 shadow-sm focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 dark:focus-within:ring-emerald-500/20 transition-all">
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startVoice}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 transition-colors"
                aria-label="Voice input"
              >
                <Mic className="h-5 w-5" />
              </motion.button>
              <input
                className="min-w-0 flex-1 bg-transparent py-3 text-base sm:text-lg outline-none text-[var(--foreground)] placeholder-[var(--muted)]"
                placeholder="What do you want to learn?"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>
            
            <motion.button
              type="submit"
              disabled={busy}
              whileHover={{ scale: busy ? 1 : 1.02 }}
              whileTap={{ scale: busy ? 1 : 0.98 }}
              className="btn-glow inline-flex shrink-0 h-14 sm:h-auto items-center justify-center gap-2 px-8 text-base font-semibold disabled:opacity-50"
            >
              Start
              <ArrowRight className="h-5 w-5" />
            </motion.button>
          </form>
        </div>
      </div>

      <div className="mt-12 flex flex-wrap justify-center gap-4">
        {[
          { href: "/dashboard", label: "Learning Paths" },
          { href: "/dashboard/goals", label: "Goals" },
          { href: "/dashboard/analytics", label: "Analytics" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="glass-pill px-6 py-2.5 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
