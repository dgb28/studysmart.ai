import Link from "next/link";
import { ArrowLeft, PlayCircle } from "lucide-react";

async function getSubject(id: string) {
  const res = await fetch(`${process.env.INTERNAL_API_URL || 'http://backend:8000'}/api/v1/subjects/${id}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export default async function SubjectPage({ params }: { params: { subjectId: string } }) {
  const subject = await getSubject(params.subjectId);

  if (!subject) {
    return <div className="p-8 text-center text-red-400 glass-panel rounded-2xl">Subject not found.</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Library
      </Link>

      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-3">{subject.name}</h1>
        <p className="text-lg text-gray-400 max-w-3xl">{subject.description}</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold border-b border-white/10 pb-2">Learning Modules</h2>
        
        {subject.modules.length === 0 ? (
          <p className="text-gray-500 italic">No modules available yet.</p>
        ) : (
          <div className="grid gap-4">
            {subject.modules.map((module: any, index: number) => (
              <div key={module.id} className="glass-panel p-6 rounded-2xl flex items-center justify-between group hover:border-blue-500/30 transition-colors">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-bold text-blue-500 bg-blue-500/10 px-2 py-1 rounded">Module {index + 1}</span>
                    <h3 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors">{module.title}</h3>
                  </div>
                  <p className="text-gray-400 text-sm mt-2">{module.description}</p>
                  <p className="text-gray-500 text-xs mt-2">{module.topics?.length || 0} Topics</p>
                </div>
                
                <Link 
                  href={`/dashboard/${subject.id}/${module.id}`}
                  className="flex items-center gap-2 bg-white/5 hover:bg-blue-600 px-5 py-3 rounded-xl font-medium transition-colors"
                >
                  <PlayCircle className="w-5 h-5" />
                  <span className="hidden sm:inline">Start Module</span>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
