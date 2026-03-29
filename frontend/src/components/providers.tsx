"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { StudyRoomProvider } from "@/components/providers/StudyRoomProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <StudyRoomProvider>
        {children}
      </StudyRoomProvider>
    </ThemeProvider>
  );
}
