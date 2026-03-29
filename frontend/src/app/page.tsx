"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/api";

export default function RootPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace(getToken() ? "/home" : "/login");
  }, [router]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] text-slate-500 transition-colors dark:text-zinc-500">
      Redirecting…
    </div>
  );
}
