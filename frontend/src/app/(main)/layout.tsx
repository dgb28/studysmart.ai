import AppHeader from "@/components/AppHeader";
import AnimatedBackdrop from "@/components/AnimatedBackdrop";

/**
 * Shared shell: animated backdrop, timer, streak, rank, nav.
 */
export default function MainShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-[var(--background)] transition-colors duration-300">
      <AnimatedBackdrop />
      <div className="noise-overlay" aria-hidden />
      <AppHeader />
      <div className="relative z-[2] mx-auto box-border flex min-h-0 w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-6 md:px-8 md:py-8">
        {children}
      </div>
    </div>
  );
}
