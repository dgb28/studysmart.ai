import SubjectCard from "@/components/SubjectCard";

async function getSubjects() {
  const res = await fetch(`${process.env.INTERNAL_API_URL || 'http://backend:8000'}/api/v1/subjects/`, { cache: 'no-store' });
  if (!res.ok) {
    return [];
  }
  return res.json();
}

export default async function DashboardPage() {
  const subjects = await getSubjects();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">My Learning Path</h1>
        <p className="text-gray-400">Select a subject to continue or start a new module.</p>
      </div>

      {subjects.length === 0 ? (
        <div className="glass-panel p-8 text-center rounded-2xl">
          <p className="text-gray-500 mb-4">No subjects found. Did you run the seed script?</p>
          <code className="bg-black/50 px-4 py-2 rounded text-sm text-blue-400">
            python backend/scripts/seed_data.py
          </code>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject: any) => (
            <SubjectCard key={subject.id} subject={subject} />
          ))}
        </div>
      )}
    </div>
  );
}
