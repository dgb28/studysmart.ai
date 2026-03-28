"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import SessionTimer from "@/components/SessionTimer";
import VoiceCoach from "@/components/VoiceCoach";
import FrictionInterventionModal from "@/components/FrictionInterventionModal";
import ProofOfLearningModal from "@/components/ProofOfLearningModal";
import { useInactivityDetector } from "@/hooks/useInactivityDetector";

export default function StudyPage({ params }: { params: { subjectId: string, moduleId: string } }) {
  const [subject, setSubject] = useState<any>(null);
  const [module, setModule] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Session State
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);
  
  // Progress State
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [completedTopics, setCompletedTopics] = useState<string[]>([]);
  
  // Modals State
  const [showFrictionModal, setShowFrictionModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  
  // Placeholder user ID for hackathon
  const U_ID = "00000000-0000-0000-0000-000000000000";

  // Friction Detection Hook
  useInactivityDetector(
    45, // 45 seconds of inactivity triggers it
    () => {
      // Only show if we actually loaded a module and are active
      if (!loading && module && !showProofModal) {
        setShowFrictionModal(true);
      }
    },
    !loading && !!module && !showProofModal && !showFrictionModal && !isVoiceActive // Don't run during modals or voice agent
  );

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/subjects/${params.subjectId}`);
        if (res.ok) {
          const data = await res.json();
          setSubject(data);
          const mod = data.modules.find((m: any) => m.id === params.moduleId);
          setModule(mod);
          
          if (mod) {
            // Start session automatically
            const sessionRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/sessions/start`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ module_id: mod.id, user_id: U_ID })
            });
            if (sessionRes.ok) {
              const sessionData = await sessionRes.json();
              setSessionId(sessionData.id);
              setSessionStartTime(sessionData.started_at);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load module data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
    
    // Cleanup: End session when unmounting
    return () => {
      if (sessionId) {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/sessions/${sessionId}/end`, {
          method: 'POST',
          keepalive: true
        }).catch(() => {});
      }
    };
  }, [params.subjectId, params.moduleId]); // Empty deps so it only runs once per page load, ignoring session updates to avoid loop


  const handleCompleteTopic = async (topicId: string) => {
    if (!sessionId) return;
    
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/sessions/${sessionId}/complete-topic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic_id: topicId, time_spent_seconds: 60 }) // Mocking 60s for now
      });
      
      setCompletedTopics(prev => [...prev, topicId]);
      
      // Advance to next or trigger Proof of Learning
      if (currentTopicIndex < (module?.topics.length || 0) - 1) {
        // Trigger micro-challenge every 2 topics, or randomly. For hackathon, trigger it on first completion:
        if (completedTopics.length === 0 || completedTopics.length % 2 === 0) {
           setShowProofModal(true);
        } else {
           setCurrentTopicIndex(prev => prev + 1);
        }
      } else {
        setShowProofModal(true); // Always test at the end
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading module...</div>;
  if (!module) return <div className="p-8 text-center text-red-500">Module not found.</div>;

  const currentTopic = module.topics[currentTopicIndex];

  return (
    <div className="flex flex-col md:flex-row gap-8 min-h-[calc(100vh-8rem)]">
      {/* Sidebar: Progress */}
      <div className="w-full md:w-80 glass-panel rounded-2xl p-6 h-fit shrink-0">
        <Link href={`/dashboard/${params.subjectId}`} className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Modules
        </Link>
        
        <h2 className="text-xl font-bold mb-1">{module.title}</h2>
        <div className="mb-6">
          {sessionStartTime && <SessionTimer startTime={sessionStartTime} />}
        </div>

        <div className="space-y-2 relative before:absolute before:inset-0 before:left-6 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-400/30 before:to-transparent">
          {module.topics.map((t: any, idx: number) => {
            const isCompleted = completedTopics.includes(t.id);
            const isActive = idx === currentTopicIndex;
            return (
              <div 
                key={t.id} 
                className={`flex gap-4 items-center p-3 rounded-xl transition-all ${
                  isActive ? 'bg-blue-600/20 border border-blue-500/30' : 
                  isCompleted ? 'opacity-50' : ''
                }`}
              >
                <div className="shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  ) : (
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold
                      ${isActive ? 'border-blue-500 text-blue-500' : 'border-gray-600 text-gray-600'}
                    `}>
                      {idx + 1}
                    </div>
                  )}
                </div>
                <div className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-400'}`}>
                  {t.title}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 glass-panel rounded-2xl p-8 lg:p-12 relative overflow-hidden flex flex-col">
        {!currentTopic ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-white mb-4">Module Completed!</h2>
            <p className="text-gray-400">You've finished all topics.</p>
          </div>
        ) : (
          <>
            <div className="max-w-3xl">
              <span className="text-blue-500 font-semibold tracking-wider text-sm uppercase mb-2 block">
                Topic {currentTopicIndex + 1}
              </span>
              <h1 className="text-3xl lg:text-4xl font-extrabold mb-6 tracking-tight">{currentTopic.title}</h1>
              
              <div className="prose prose-invert prose-lg max-w-none text-gray-300">
                <p>{currentTopic.content}</p>
                {/* Normally we'd render standard markdown here using react-markdown */}
              </div>
            </div>

            <div className="mt-auto pt-16 border-t border-white/10 flex justify-end">
              <button 
                onClick={() => handleCompleteTopic(currentTopic.id)}
                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] transform hover:-translate-y-1 flex items-center gap-2"
              >
                Mark Complete <CheckCircle2 className="w-5 h-5" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Persistent AI Voice Coach Widget (Context-Aware) */}
      {currentTopic && (
        <VoiceCoach 
          key={currentTopic.id} 
          onActiveChange={setIsVoiceActive}
          context={{ 
            topic_title: currentTopic.title, 
            topic_content: currentTopic.content,
            subject_name: subject?.name || "",
            module_title: module?.title || ""
          }} 
        />
      )}

      {/* Friction Detection Modal */}
      <FrictionInterventionModal 
        isOpen={showFrictionModal} 
        onClose={() => setShowFrictionModal(false)}
        onAction={(action) => console.log("Friction action selected:", action)} 
      />

      {/* Proof of Learning Modal */}
      {currentTopic && (
        <ProofOfLearningModal 
          isOpen={showProofModal}
          topicTitle={currentTopic.title}
          onClose={() => setShowProofModal(false)}
          onSuccess={() => {
            if (currentTopicIndex < module.topics.length - 1) {
               setCurrentTopicIndex(prev => prev + 1);
            } else {
               alert("Course perfectly completed! Updating Study Plan...");
               window.location.href = `/dashboard`;
            }
          }}
        />
      )}
    </div>
  );
}
