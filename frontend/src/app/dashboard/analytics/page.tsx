"use client";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Flame, Clock, Target, BrainCircuit } from "lucide-react";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const U_ID = "00000000-0000-0000-0000-000000000000";

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/analytics/${U_ID}`)
      .then(r => r.json())
      .then(setData)
      .catch(console.error);
  }, []);

  if (!data) return <div className="p-8 text-center text-gray-500">Loading Analytics...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Learning Analytics</h1>
        <p className="text-gray-400">Track your cognitive load, focus time, and knowledge retention.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-2xl border-blue-500/20">
          <Clock className="w-8 h-8 text-blue-400 mb-4" />
          <div className="text-3xl font-bold">{data.total_minutes_studied}m</div>
          <div className="text-sm text-gray-400">Total Focus Time</div>
        </div>
        <div className="glass-panel p-6 rounded-2xl border-orange-500/20">
          <Flame className="w-8 h-8 text-orange-400 mb-4" />
          <div className="text-3xl font-bold">7</div>
          <div className="text-sm text-gray-400">Day Streak</div>
        </div>
        <div className="glass-panel p-6 rounded-2xl border-green-500/20">
          <Target className="w-8 h-8 text-green-400 mb-4" />
          <div className="text-3xl font-bold">{data.topics_completed}</div>
          <div className="text-sm text-gray-400">Topics Mastered</div>
        </div>
        <div className="glass-panel p-6 rounded-2xl border-purple-500/20">
          <BrainCircuit className="w-8 h-8 text-purple-400 mb-4" />
          <div className="text-3xl font-bold">94%</div>
          <div className="text-sm text-gray-400">Average Retention</div>
        </div>
      </div>

      <div className="glass-panel p-8 rounded-3xl h-[400px]">
        <h3 className="text-xl font-semibold mb-6">Focus Trend (Last 7 Days)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.daily_focus} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="date" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
              cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
              contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }} 
            />
            <Bar dataKey="minutes" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={50} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
