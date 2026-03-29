"use client";

import { useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/api";

export default function RootPage() {
  const router = useRouter();
  useLayoutEffect(() => {
    router.replace(getToken() ? "/home" : "/login");
  }, [router]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500/20 border-t-indigo-500 dark:border-cyan-500/20 dark:border-t-cyan-400" />
    </div>
  );
}
