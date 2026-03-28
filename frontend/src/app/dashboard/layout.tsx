import Link from "next/link";
import { BrainCircuit, BookOpen, BarChart2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col font-sans">
      <header className="sticky top-0 z-50 glass-panel border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <BrainCircuit className="w-6 h-6 text-blue-500 group-hover:text-blue-400 transition-colors" />
          <span className="text-xl font-bold tracking-tight">StudyPulse</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href="/dashboard" className="text-gray-300 hover:text-white flex items-center gap-2 transition-colors">
            <BookOpen className="w-4 h-4" />
            Library
          </Link>
          <button className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors">
            <BarChart2 className="w-4 h-4" />
            Analytics
          </button>
        </nav>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
