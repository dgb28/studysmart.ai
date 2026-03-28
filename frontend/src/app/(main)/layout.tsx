import AppHeader from "@/components/AppHeader";
import AnimatedBackdrop from "@/components/AnimatedBackdrop";

/**
 * Shared shell: animated backdrop, timer, streak, rank, nav.
 */
export default function MainShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden bg-[#050508]">
      <AnimatedBackdrop />
      <div className="noise-overlay" aria-hidden />
      <AppHeader />
      <div className="relative z-[2] flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-10 box-border">
        {children}
      </div>
    </div>
  );
}
