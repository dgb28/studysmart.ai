"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";
import { FolderGit2, LogOut, Flame, Target, Infinity as InfinityIcon } from "lucide-react";
import { setToken } from "@/lib/api";
import { motion } from "framer-motion";

export default function AppHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Paths", href: "/dashboard" },
    { label: "Goals", href: "/dashboard/goals" },
    { label: "Analysis", href: "/dashboard/analytics" },
    { label: "Home", href: "/home" },
  ];

  return (
    <header
      className={`fixed left-0 right-0 z-50 mx-auto w-[95%] max-w-5xl rounded-full border transition-all duration-300 ${
        scrolled 
          ? "top-4 bg-[var(--card)]/80 backdrop-blur-md border-[var(--border)] shadow-lg shadow-black/5 dark:shadow-black/20" 
          : "top-6 bg-transparent border-transparent shadow-none"
      }`}
    >
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        
        {/* Left Side: Logo */}
        <div className="flex items-center gap-3">
          <Link
            href="/home"
            className="group flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <FolderGit2 className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold tracking-tight text-[var(--foreground)] hidden sm:block">
              StudyPulse
            </span>
          </Link>
        </div>

        {/* Center: Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative text-sm font-medium transition-colors ${
                  isActive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {link.label}
                {isActive && (
                  <motion.div
                    layoutId="header-active-tab"
                    className="absolute -bottom-[22px] left-0 right-0 h-0.5 bg-emerald-500 rounded-t-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Side: Tools & Profile */}
        <div className="flex items-center gap-4">
          
          <div className="hidden sm:flex items-center gap-3 pr-4 border-r border-[var(--border)]">
            <Link
              href="/dashboard/goals"
              className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
            >
              <Flame className="h-4 w-4" />
              <span>3</span>
            </Link>
            
            <Link
              href="/dashboard/leaderboard"
              className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-500/10 transition-colors"
            >
              <Target className="h-4 w-4" />
              <span>#12</span>
            </Link>
          </div>

          <ThemeToggle />

          <button
            onClick={() => {
              setToken("");
              window.location.href = "/login";
            }}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
