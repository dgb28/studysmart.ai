"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import VoiceCoach from "@/components/VoiceCoach";
import { getToken, api, isUnauthorized } from "@/lib/api";

type Topic = { id: string; title: string; content: string | null; order: number };
type QuizQ = { index: number; question: string; options: string[] };
type Board = { rank: number; display_name: string; score: number }[];

export default function StudyPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params.subjectId as string;
  const moduleId = params.moduleId as string;

  const [subject, setSubject] = useState<any>(null);
  const [module, setModule] = useState<any>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [idx, setIdx] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [unlocked, setUnlocked] = useState(true);
  const [hasContent, setHasContent] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const [phase, setPhase] = useState<"content" | "quiz" | "locked">("content");
  const [loadingContent, setLoadingContent] = useState(false);
  const [quizQs, setQuizQs] = useState<QuizQ[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<{
    passed: boolean;
    score_percent: number;
    wrong_explanations: { index: number; your_answer: string; correct_answer: string; explanation: string }[];
  } | null>(null);
  const [board, setBoard] = useState<Board>([]);
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  const topic = topics[idx];

  const loadBoard = useCallback(() => {
    if (!getToken()) return;
    api<Board>("/leaderboard/board")
      .then((rows) => setBoard(rows.slice(0, 12)))
      .catch(() => {});
  }, []);

  const refreshTopicState = useCallback(async () => {
    if (!topic?.id) return;
    try {
      const s = await api<{ unlocked: boolean; has_content: boolean; quiz_passed: boolean }>(`/topic/${topic.id}/state`);
      setUnlocked(s.unlocked);
      setHasContent(s.has_content);
      setQuizPassed(s.quiz_passed);
      if (!s.unlocked) setPhase("locked");
      else if (s.quiz_passed) setPhase("content");
      else if (s.has_content) setPhase("content");
      else setPhase("content");
    } catch {
      setUnlocked(false);
      setPhase("locked");
    }
  }, [topic?.id]);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    loadBoard();
    (async () => {
      const data = await api<any>(`/subjects/${subjectId}`);
      setSubject(data);
      const mod = data.modules?.find((m: any) => m.id === moduleId);
      setModule(mod);
      const ts = (mod?.topics || []).slice().sort((a: Topic, b: Topic) => a.order - b.order);
      setTopics(ts);
      if (mod) {
        const sessionRes = await api<{ id: string }>("/sessions/start", {
          method: "POST",
          json: { module_id: mod.id },
        });
        setSessionId(sessionRes.id);
      }
    })().catch((e) => {
      if (isUnauthorized(e)) router.replace("/login");
      else console.error(e);
    });
  }, [subjectId, moduleId, router, loadBoard]);

  useEffect(() => {
    refreshTopicState();
    setResult(null);
    setQuizQs([]);
    setAnswers([]);
  }, [topic?.id, refreshTopicState]);

  async function ensureAiContent() {
    if (!topic) return;
    setLoadingContent(true);
    try {
      await api(`/topic/${topic.id}/generate-content`, { method: "POST" });
      const data = await api<any>(`/subjects/${subjectId}`);
      const mod = data.modules?.find((m: any) => m.id === moduleId);
      const ts = (mod?.topics || []).slice().sort((a: Topic, b: Topic) => a.order - b.order);
      setTopics(ts);
      await refreshTopicState();
    } catch (e) {
      console.error(e);
      alert("Could not generate lesson (OpenAI key?)");
    } finally {
      setLoadingContent(false);
    }
  }

  async function markRead() {
    if (!topic) return;
    await api(`/topic/${topic.id}/content-viewed`, { method: "POST" });
    setPhase("quiz");
    try {
      const q = await api<{ questions: QuizQ[] }>(`/topic/${topic.id}/quiz`);
      setQuizQs(q.questions);
      setAnswers(q.questions.map(() => 0));
    } catch (e) {
      console.error(e);
      alert("Quiz load failed");
    }
  }

  async function submitQuiz() {
    if (!topic) return;
    try {
      const res = await api<{
        passed: boolean;
        score_percent: number;
        wrong_explanations: { index: number; your_answer: string; correct_answer: string; explanation: string }[];
      }>(`/topic/${topic.id}/quiz/submit`, { method: "POST", json: { answers } });
      setResult(res);
      if (res.passed) {
        setQuizPassed(true);
        if (sessionId) {
          await api(`/sessions/${sessionId}/complete-topic`, {
            method: "POST",
            json: { topic_id: topic.id, time_spent_seconds: 120 },
          });
        }
        loadBoard();
      }
    } catch (e) {
      console.error(e);
      alert("Submit failed");
    }
  }

  function nextTopic() {
    setResult(null);
    setQuizQs([]);
    if (idx < topics.length - 1) setIdx(idx + 1);
    else router.push(`/dashboard/${subjectId}`);
  }

  if (!module || !subject)
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <motion.div
          className="h-10 w-10 rounded-full border-2 border-violet-400/30 border-t-violet-400"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-8 lg:flex-row">
      <motion.aside
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        className="glass-panel order-2 h-fit w-full shrink-0 rounded-[2rem] p-5 lg:order-1 lg:w-60"
      >
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Leaderboard</p>
        <ul className="max-h-[50vh] space-y-2 overflow-y-auto text-xs">
          {board.map((r, i) => (
            <motion.li
              key={r.display_name + r.rank}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center justify-between gap-2 rounded-full border border-white/5 bg-white/[0.03] px-3 py-2"
            >
              <span className="truncate text-zinc-300">
                <span className="mr-1.5 font-mono text-cyan-400/90">{r.rank}.</span>
                {r.display_name}
              </span>
              <span className="shrink-0 font-medium text-zinc-500">{r.score}</span>
            </motion.li>
          ))}
        </ul>
      </motion.aside>

      <div className="order-1 flex flex-1 flex-col gap-6 lg:order-2">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-[2rem] p-6"
        >
          <Link
            href={`/dashboard/${subjectId}`}
            className="mb-4 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-400 transition hover:border-white/20 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Modules
          </Link>
          <h2 className="bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-xl font-bold text-transparent">
            {module.title}
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Topic {idx + 1} / {topics.length}
          </p>
          <div className="mt-5 flex flex-col gap-2">
            {topics.map((t, i) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setIdx(i)}
                className={`rounded-full px-4 py-2.5 text-left text-sm transition ${
                  i === idx
                    ? "bg-gradient-to-r from-cyan-500/20 to-violet-600/20 font-medium text-white ring-1 ring-cyan-500/40"
                    : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
                }`}
              >
                {i + 1}. {t.title}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div
          layout
          className="glass-panel relative flex-1 rounded-[2rem] p-8"
        >
          {!topic ? (
            <p className="text-zinc-500">No topics.</p>
          ) : phase === "locked" || !unlocked ? (
            <p className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-200">
              Complete the previous topic&apos;s quiz to unlock this one.
            </p>
          ) : (
            <>
              <h1 className="mb-4 text-2xl font-bold text-white">{topic.title}</h1>

              {!hasContent && (
                <div className="mb-6">
                  <p className="mb-3 text-sm text-zinc-400">
                    No lesson text yet. Generate from AI (uses your study material context).
                  </p>
                  <button
                    type="button"
                    disabled={loadingContent}
                    onClick={ensureAiContent}
                    className="btn-glow inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 disabled:opacity-50"
                  >
                    {loadingContent && <Loader2 className="h-4 w-4 animate-spin" />}
                    Generate lesson
                  </button>
                </div>
              )}

              {quizPassed ? (
                <div className="space-y-4">
                  <p className="font-medium text-emerald-400">Quiz passed for this topic.</p>
                  <button
                    type="button"
                    onClick={nextTopic}
                    className="rounded-full border border-white/15 bg-white/10 px-6 py-3 text-sm font-medium transition hover:bg-white/15"
                  >
                    {idx < topics.length - 1 ? "Next topic" : "Back to subject"}
                  </button>
                </div>
              ) : phase === "quiz" && quizQs.length > 0 && !result ? (
                <div className="space-y-6">
                  <p className="text-sm text-zinc-400">10 questions · need 70% to continue.</p>
                  {quizQs.map((q, qi) => (
                    <div
                      key={q.index}
                      className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm"
                    >
                      <p className="mb-3 font-medium text-zinc-100">
                        {qi + 1}. {q.question}
                      </p>
                      <div className="space-y-2">
                        {q.options.map((opt, oi) => (
                          <label
                            key={oi}
                            className={`flex cursor-pointer items-center gap-3 rounded-full border px-4 py-2.5 text-sm transition ${
                              answers[qi] === oi
                                ? "border-cyan-500/50 bg-cyan-500/10 text-white"
                                : "border-white/10 hover:border-white/20 hover:bg-white/5"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`q-${qi}`}
                              className="accent-cyan-400"
                              checked={answers[qi] === oi}
                              onChange={() => {
                                const next = [...answers];
                                next[qi] = oi;
                                setAnswers(next);
                              }}
                            />
                            {opt}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={submitQuiz}
                    className="btn-glow rounded-full bg-gradient-to-r from-cyan-500 to-violet-600 px-8 py-3.5 font-semibold text-white shadow-lg shadow-cyan-500/25"
                  >
                    Submit
                  </button>
                </div>
              ) : result ? (
                <div className="space-y-4">
                  <p
                    className={
                      result.passed ? "text-lg font-bold text-emerald-400" : "text-lg font-bold text-red-400"
                    }
                  >
                    Score {result.score_percent}% — {result.passed ? "Passed" : "Failed — retake required"}
                  </p>
                  {result.wrong_explanations.length > 0 && (
                    <div className="space-y-3 text-sm">
                      <p className="text-zinc-400">Review:</p>
                      {result.wrong_explanations.map((w) => (
                        <div
                          key={w.index}
                          className="rounded-2xl border border-white/10 bg-black/30 p-4"
                        >
                          <p className="text-red-300">Q{w.index + 1}</p>
                          <p className="text-zinc-300">Your answer: {w.your_answer}</p>
                          <p className="text-zinc-300">Correct: {w.correct_answer}</p>
                          <p className="mt-1 text-zinc-500">{w.explanation}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {result.passed ? (
                    <button
                      type="button"
                      onClick={nextTopic}
                      className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-3.5 font-semibold text-white shadow-lg shadow-emerald-500/20"
                    >
                      Continue
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setResult(null);
                        setAnswers(quizQs.map(() => 0));
                      }}
                      className="rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-8 py-3.5 font-semibold text-white shadow-lg shadow-amber-500/20"
                    >
                      Retake quiz
                    </button>
                  )}
                </div>
              ) : hasContent ? (
                <>
                  <div className="prose prose-invert mb-8 max-w-none whitespace-pre-wrap text-zinc-300">
                    {topic.content}
                  </div>
                  <button
                    type="button"
                    onClick={markRead}
                    className="btn-glow inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-violet-600 px-8 py-3.5 font-semibold text-white shadow-lg shadow-cyan-500/25"
                  >
                    I&apos;ve read this — take quiz <CheckCircle2 className="h-5 w-5" />
                  </button>
                </>
              ) : null}
            </>
          )}
        </motion.div>
      </div>

      {topic && unlocked && hasContent && (
        <VoiceCoach
          key={topic.id}
          onActiveChange={setIsVoiceActive}
          context={{
            topic_title: topic.title,
            topic_content: topic.content || "",
            subject_name: subject?.name || "",
            module_title: module?.title || "",
          }}
        />
      )}
    </div>
  );
}
