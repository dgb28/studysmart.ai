import Link from "next/link";
import { Database, Binary, BookOpen, LucideIcon } from "lucide-react";

interface Subject {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  description: string | null;
}

const ICON_MAP: Record<string, LucideIcon> = {
  Database: Database,
  Binary: Binary,
  BookOpen: BookOpen,
};

export default function SubjectCard({ subject }: { subject: Subject }) {
  const IconComponent = subject.icon && ICON_MAP[subject.icon] ? ICON_MAP[subject.icon] : BookOpen;
  
  // Use a fallback color if none provided
  const bgColorClass = subject.color || "bg-indigo-600";

  return (
    <Link href={`/dashboard/${subject.id}`} className="block group">
      <div className="glass-panel rounded-2xl p-6 h-full transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:border-gray-600 flex flex-col items-start gap-4 relative overflow-hidden">
        
        {/* Decorative background glow based on color */}
        <div className={`absolute -right-10 -top-10 w-32 h-32 ${bgColorClass} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`} />

        <div className={`p-3 rounded-xl ${bgColorClass} bg-opacity-20 border border-white/5`}>
          <IconComponent className="w-6 h-6 text-white" />
        </div>
        
        <div>
          <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors">{subject.name}</h3>
          <p className="text-sm text-gray-400 line-clamp-2">
            {subject.description || "Start learning this subject to build your skills."}
          </p>
        </div>

        <div className="mt-auto pt-4 w-full flex items-center justify-between text-xs font-medium text-gray-500 group-hover:text-gray-300">
          <span>Click to view modules</span>
          <span className="text-blue-500">→</span>
        </div>
      </div>
    </Link>
  );
}
