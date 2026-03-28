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
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-gray-500">
      Redirecting…
    </div>
  );
}
