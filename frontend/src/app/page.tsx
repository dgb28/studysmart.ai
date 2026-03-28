import Link from "next/link";
import { BrainCircuit } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="z-10 flex flex-col items-center max-w-2xl text-center space-y-8 glass-panel p-12 rounded-3xl">
        <div className="flex items-center justify-center w-20 h-20 bg-blue-500/10 rounded-2xl border border-blue-500/20 mb-2 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
          <BrainCircuit className="w-10 h-10 text-blue-400" />
        </div>
        
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
          Welcome to <span className="gradient-text">StudyPulse</span>
        </h1>
        
        <p className="text-lg text-gray-400 max-w-xl leading-relaxed">
          The cognitive learning platform with AI-powered accountability. 
          Stop tracking hours, start proving your knowledge.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 pt-4 w-full sm:w-auto">
          <Link
            href="/dashboard"
            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-blue-500/25 flex items-center justify-center"
          >
            Enter Dashboard
          </Link>
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            className="px-8 py-4 glass-panel hover:bg-white/5 rounded-xl font-semibold transition-colors flex items-center justify-center"
          >
            API Documentation
          </a>
        </div>
      </div>
    </main>
  );
}
