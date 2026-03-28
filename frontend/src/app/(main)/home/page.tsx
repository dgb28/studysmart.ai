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

  // Register vs login greeting: flag set only on signup; cleared on login. Do not read+remove
  // synchronously (React Strict Mode double-mount would drop the first-time message).
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
      const res = await api<{ target: string; learning_topic: string | null }>("/learning/home/classify", {
        method: "POST",
        json: { text: text.trim() },
      });
      if (res.target === "daily_goals") router.push("/dashboard/goals");
      else if (res.target === "analysis") router.push("/dashboard/analytics");
      else {
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
      <div className="flex flex-1 items-center justify-center py-24">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          className="h-10 w-10 rounded-full border-2 border-cyan-400/30 border-t-cyan-400"
        />
      </div>
    );
  if (loadErr) return <div className="text-amber-400 text-center py-24">{loadErr}</div>;

  const name = me!.full_name || me!.email.split("@")[0];
  const subline = isSignupFlow
    ? "What would you like to learn today?"
    : "Welcome back";

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-14rem)] py-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="text-center max-w-2xl mb-10"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.1, stiffness: 400, damping: 15 }}
          className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/30 to-violet-600/40 ring-1 ring-white/10 mb-6"
        >
          <Sparkles className="w-8 h-8 text-cyan-200" />
        </motion.div>
        <motion.p
          className="text-3xl md:text-5xl font-bold tracking-tight text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          Hi, {name}
        </motion.p>
        <motion.p
          className="mt-3 text-2xl md:text-4xl font-semibold gradient-text"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
        >
          {subline}
        </motion.p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        onSubmit={handleSubmit}
        className="w-full max-w-2xl flex flex-col sm:flex-row gap-3"
      >
        <div className="flex-1 flex items-center gap-3 glass-panel rounded-full pl-2 pr-2 py-1.5 border border-white/[0.08] shadow-[0_0_40px_rgba(34,211,238,0.06)]">
          <motion.button
            type="button"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            onClick={startVoice}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/30 to-fuchsia-500/20 text-violet-200"
            aria-label="Voice input"
          >
            <Mic className="w-5 h-5" />
          </motion.button>
          <input
            className="flex-1 bg-transparent py-3 outline-none text-white placeholder:text-zinc-600 text-sm md:text-base"
            placeholder="Goals, analytics, or “I want to learn DBMS”…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        <motion.button
          type="submit"
          disabled={busy}
          whileHover={{ scale: busy ? 1 : 1.03 }}
          whileTap={{ scale: busy ? 1 : 0.97 }}
          className="btn-glow px-8 py-3.5 disabled:opacity-40 rounded-full flex items-center justify-center gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          Go
        </motion.button>
      </motion.form>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="mt-12 flex flex-wrap justify-center gap-3"
      >
        {[
          { href: "/dashboard", label: "Learning paths" },
          { href: "/dashboard/goals", label: "Daily goals" },
          { href: "/dashboard/analytics", label: "Analysis" },
        ].map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-full glass-pill px-5 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-all hover:shadow-[0_0_24px_rgba(167,139,250,0.15)]"
          >
            {l.label}
          </Link>
        ))}
      </motion.div>
    </div>
  );
}
