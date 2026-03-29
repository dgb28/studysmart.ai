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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.webkitSpeechRecognition || w.SpeechRecognition;
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
    <div
      className="-mx-4 flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-4 overflow-hidden py-1 sm:-mx-6 md:-mx-8"
      style={{ backgroundColor: "var(--home-hero-bg)" }}
    >
      <div className="flex w-full max-w-3xl flex-col justify-center px-4 sm:px-6">
        <div
          className="mx-auto w-full rounded-[1.5rem] border p-6 shadow-[var(--home-card-shadow)] sm:p-8 md:rounded-[1.75rem]"
          style={{
            backgroundColor: "var(--home-card-bg)",
            borderColor: "var(--home-card-border)",
          }}
        >
          <div className="mb-5 flex justify-center sm:mb-6">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl sm:h-12 sm:w-12"
              style={{ backgroundColor: "var(--home-mic-bg)" }}
            >
              <Sparkles
                className="h-6 w-6 text-indigo-600 dark:text-[#a78bfa]"
                strokeWidth={1.75}
              />
            </div>
          </div>

          <p
            className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.18em] sm:mb-3 sm:text-sm md:text-base"
            style={{ color: "var(--home-eyebrow)" }}
          >
            {eyebrow}
          </p>
          <h1
            className="text-center text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
            style={{ color: "var(--home-title)" }}
          >
            Hi, {name}
          </h1>
          <p
            className="mx-auto mt-3 max-w-2xl text-center text-balance text-lg leading-relaxed sm:mt-4 sm:text-xl md:text-2xl md:leading-relaxed"
            style={{ color: "var(--home-muted)" }}
          >
            {question}
          </p>

          <form
            onSubmit={handleSubmit}
            className="mx-auto mt-6 flex w-full flex-col gap-3 sm:mt-8 lg:flex-row lg:items-stretch"
          >
            <div
              className="flex min-h-[3rem] flex-1 items-center gap-2 rounded-xl border bg-transparent px-2 py-1.5 shadow-sm dark:bg-white/5 sm:min-h-[3.25rem] sm:gap-3 sm:rounded-2xl sm:px-3 sm:py-2"
              style={{ borderColor: "var(--home-input-border)" }}
            >
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={startVoice}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-indigo-600 sm:h-10 sm:w-10 sm:rounded-xl dark:text-violet-200"
                style={{ backgroundColor: "var(--home-mic-bg)" }}
                aria-label="Voice input"
              >
                <Mic className="h-5 w-5" />
              </motion.button>
              <input
                className="min-w-0 flex-1 bg-transparent py-1.5 text-sm outline-none sm:py-2 sm:text-base"
                style={{ color: "var(--foreground)" }}
                placeholder="e.g. Meeting at 6pm today, or I want to learn DBMS…"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>
            <motion.button
              type="submit"
              disabled={busy}
              whileHover={{ scale: busy ? 1 : 1.02 }}
              whileTap={{ scale: busy ? 1 : 0.98 }}
              className="btn-glow inline-flex min-h-[3rem] shrink-0 items-center justify-center gap-2 rounded-xl px-8 text-sm font-semibold disabled:opacity-40 sm:min-h-[3.25rem] sm:rounded-2xl sm:px-10 sm:text-base"
            >
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
              Go
            </motion.button>
          </form>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex shrink-0 flex-wrap justify-center gap-3 px-4 sm:gap-4 md:gap-5"
      >
        {[
          { href: "/dashboard", label: "Learning paths" },
          { href: "/dashboard/goals", label: "Daily Progress" },
          { href: "/dashboard/analytics", label: "Analysis" },
        ].map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="min-w-[11.5rem] rounded-2xl px-7 py-3.5 text-center text-base font-semibold transition hover:opacity-90 sm:min-w-[12.5rem] sm:px-9 sm:py-4 sm:text-lg md:min-w-[13.5rem] md:px-10 md:py-[1.125rem] md:text-xl"
            style={{
              backgroundColor: "var(--home-link-bg)",
              color: "var(--home-link-text)",
            }}
          >
            {l.label}
          </Link>
        ))}
      </motion.div>
    </div>
  );
}
