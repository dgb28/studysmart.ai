import AppHeader from "@/components/AppHeader";
import AnimatedBackdrop from "@/components/AnimatedBackdrop";
import FloatingVideoOverlay from "@/components/FloatingVideoOverlay";

/**
 * Rooms shell: same navigation and backdrop as the (main) route group.
 */
export default function RoomsShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-[var(--background)] transition-colors duration-300">
      <AnimatedBackdrop />
      <div className="noise-overlay" aria-hidden />
      <AppHeader />
      <FloatingVideoOverlay />
      <div className="relative z-10 mx-auto box-border flex min-h-0 w-full max-w-7xl flex-1 flex-col px-4 pt-24 pb-6 sm:px-6 md:px-8 md:pt-28 md:pb-8">
        {children}
      </div>
    </div>
  );
}
