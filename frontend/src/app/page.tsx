"use client";

import { useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/api";

export default function RootPage() {
  const router = useRouter();
  useLayoutEffect(() => {
    router.replace(getToken() ? "/home" : "/login");
  }, [router]);
  return <div className="min-h-screen bg-[var(--background)]" />;
}
