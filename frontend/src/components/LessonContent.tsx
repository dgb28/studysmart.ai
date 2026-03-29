"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { createContext, useContext } from "react";

interface LessonContentProps {
  content: string;
}

// Track list nesting depth via context
const ListDepthContext = createContext(0);

// Symbols per depth level for unordered lists
const UL_SYMBOLS = ["▸", "◆", "–", "·"];
function getUlSymbol(depth: number) {
  return UL_SYMBOLS[Math.min(depth, UL_SYMBOLS.length - 1)];
}

// Check if li children are effectively empty (lone dot, comma, whitespace, etc.)
function isEmptyLiContent(children: React.ReactNode): boolean {
  // Flatten children to a string and check if it's just punctuation/whitespace
  const str = extractText(children).trim();
  return str.length <= 2 && /^[.,;:\s]*$/.test(str);
}

function extractText(node: React.ReactNode): string {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (typeof node === "object" && "props" in (node as any)) {
    return extractText((node as any).props?.children);
  }
  return "";
}

function MarkdownUl({ children }: { children?: React.ReactNode }) {
  const depth = useContext(ListDepthContext);
  return (
    <ListDepthContext.Provider value={depth + 1}>
      <ul className="mb-5 ml-1 space-y-2">{children}</ul>
    </ListDepthContext.Provider>
  );
}

function MarkdownOl({ children }: { children?: React.ReactNode }) {
  const depth = useContext(ListDepthContext);
  return (
    <ListDepthContext.Provider value={depth + 1}>
      <ol className="mb-5 ml-1 space-y-2 list-none">{children}</ol>
    </ListDepthContext.Provider>
  );
}

function MarkdownLi({ children }: any) {
  const depth = useContext(ListDepthContext);

  // Skip rendering near-empty list items (lone dots, commas, etc.)
  if (isEmptyLiContent(children)) return null;

  // Symbol lookup
  const symbol = getUlSymbol(Math.max(0, depth - 1));

  // Symbol styles per depth
  const symbolStyle =
    depth <= 1
      ? "text-emerald-500 font-bold text-base leading-7 mt-0 shrink-0 w-4"
      : depth === 2
      ? "text-emerald-400/70 text-xs leading-7 mt-[2px] shrink-0 w-4"
      : "text-slate-400 text-xs leading-7 mt-[2px] shrink-0 w-4";

  return (
    <li className="flex items-start gap-2 text-[var(--muted)] text-[15px] leading-7">
      <span className={symbolStyle}>{symbol}</span>
      <span className="flex-1 min-w-0">{children}</span>
    </li>
  );
}

export default function LessonContent({ content }: LessonContentProps) {
  const components: Components = {
    // ── Headings ──────────────────────────────────────────────────────────
    h1: ({ children }) => (
      <h1 className="mb-6 mt-2 text-2xl font-extrabold tracking-tight text-[var(--foreground)] border-b border-[var(--border)] pb-4">
        {children}
      </h1>
    ),

    h2: ({ children }) => (
      <h2 className="mb-4 mt-10 flex items-center gap-3 text-lg font-bold text-[var(--foreground)]">
        <span className="inline-flex h-6 w-1 rounded-full bg-emerald-500 shrink-0" />
        {children}
      </h2>
    ),

    h3: ({ children }) => (
      <h3 className="mb-3 mt-7 flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
        <span className="text-emerald-400">◈</span>
        {children}
      </h3>
    ),

    h4: ({ children }) => (
      <h4 className="mb-2 mt-5 font-semibold text-[var(--foreground)]">
        {children}
      </h4>
    ),

    // ── Body text ─────────────────────────────────────────────────────────
    p: ({ children }) => (
      <p className="mb-4 leading-7 text-[var(--muted)] text-[15px]">
        {children}
      </p>
    ),

    strong: ({ children }) => (
      <strong className="font-semibold text-[var(--foreground)]">{children}</strong>
    ),

    em: ({ children }) => (
      <em className="italic text-[var(--muted)]">{children}</em>
    ),

    // ── Lists ─────────────────────────────────────────────────────────────
    ul: MarkdownUl,
    ol: MarkdownOl,
    li: MarkdownLi,

    // ── Code ─────────────────────────────────────────────────────────────
    code: ({ inline, className, children, ...props }: any) => {
      if (inline) {
        return (
          <code
            className="rounded-md bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[13px] text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-500/20"
            {...props}
          >
            {children}
          </code>
        );
      }

      const lang = className?.replace("language-", "") ?? "";
      const langLabel = lang || "code";

      return (
        <div className="mb-6 mt-4 rounded-xl overflow-hidden border border-white/10 shadow-lg">
          {/* Header bar with language */}
          <div className="flex items-center justify-between bg-slate-800 dark:bg-black/70 px-4 py-2.5 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
            </div>
            <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-emerald-400">
              {langLabel}
            </span>
          </div>
          <pre className="overflow-x-auto p-5 font-mono text-sm leading-6 text-slate-200 bg-slate-900 dark:bg-[#0d1117]">
            <code>{children}</code>
          </pre>
        </div>
      );
    },

    // ── Blockquote ────────────────────────────────────────────────────────
    blockquote: ({ children }) => (
      <blockquote className="mb-5 rounded-xl border-l-4 border-emerald-400 bg-emerald-50 dark:bg-emerald-500/5 pl-5 pr-4 py-4 text-[15px] text-emerald-900 dark:text-emerald-100">
        {children}
      </blockquote>
    ),

    // ── HR ────────────────────────────────────────────────────────────────
    hr: () => (
      <div className="my-8 flex items-center gap-3">
        <div className="h-px flex-1 bg-[var(--border)]" />
        <span className="text-emerald-400 text-xs">✦</span>
        <div className="h-px flex-1 bg-[var(--border)]" />
      </div>
    ),

    // ── Table ─────────────────────────────────────────────────────────────
    table: ({ children }) => (
      <div className="mb-6 w-full overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="w-full text-sm">{children}</table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-semibold uppercase tracking-wider">
        {children}
      </thead>
    ),
    tbody: ({ children }) => (
      <tbody className="divide-y divide-[var(--border)]">{children}</tbody>
    ),
    tr: ({ children }) => (
      <tr className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">{children}</tr>
    ),
    th: ({ children }) => <th className="px-4 py-3 text-left">{children}</th>,
    td: ({ children }) => <td className="px-4 py-3 text-[var(--muted)]">{children}</td>,
  };

  return (
    <div className="lesson-content max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
