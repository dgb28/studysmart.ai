"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

export default function SessionTimer({ 
  startTime 
}: { 
  startTime: Date | string 
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = new Date(startTime).getTime();
    
    const updateTime = () => {
      const now = new Date().getTime();
      setElapsed(Math.floor((now - start) / 1000));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 glass-panel px-4 py-2 rounded-lg font-mono text-sm text-gray-300 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
      <Clock className="w-4 h-4 text-blue-400" />
      <span className="tabular-nums tracking-wider">{formatTime(elapsed)}</span>
    </div>
  );
}
