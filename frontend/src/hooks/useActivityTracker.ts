import { useEffect, useRef } from "react";

export interface ActivityCounts {
  mouse_movements: number;
  keyboard_inputs: number;
  tab_changes: number;
  window_blurs: number;
}

interface UseActivityTrackerProps {
  onActiveStatusChange: (isActive: boolean, counts?: ActivityCounts) => void;
  idleTimeoutMs?: number;
}

export function useActivityTracker({ onActiveStatusChange, idleTimeoutMs = 30000 }: UseActivityTrackerProps) {
  const isActiveRef = useRef(false);
  const idleTimerRef = useRef<number | null>(null);
  const onActiveStatusChangeRef = useRef(onActiveStatusChange);
  
  const countsRef = useRef<ActivityCounts>({
    mouse_movements: 0,
    keyboard_inputs: 0,
    tab_changes: 0,
    window_blurs: 0
  });

  useEffect(() => {
    onActiveStatusChangeRef.current = onActiveStatusChange;
  }, [onActiveStatusChange]);

  useEffect(() => {
    const notifyChange = (newActive: boolean) => {
      if (isActiveRef.current !== newActive) {
        isActiveRef.current = newActive;
        if (!newActive) {
          onActiveStatusChangeRef.current(newActive, { ...countsRef.current });
          countsRef.current = { mouse_movements: 0, keyboard_inputs: 0, tab_changes: 0, window_blurs: 0 };
        } else {
          onActiveStatusChangeRef.current(newActive);
        }
      }
    };

    const handleActivityObj = (e: Event) => {
      if (e.type === "mousemove") countsRef.current.mouse_movements++;
      else if (e.type === "keydown") countsRef.current.keyboard_inputs++;
      notifyChange(true);
      resetIdleTimer();
    };

    const handleActivity = () => {
      notifyChange(true);
      resetIdleTimer();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        countsRef.current.tab_changes++;
        notifyChange(false);
      } else {
        countsRef.current.tab_changes++;
        notifyChange(true);
        resetIdleTimer();
      }
    };

    const handleWindowBlur = () => {
      countsRef.current.window_blurs++;
      notifyChange(false);
    };

    const resetIdleTimer = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = window.setTimeout(() => {
        notifyChange(false);
      }, idleTimeoutMs);
    };

    const specificEvents = ["mousemove", "keydown"];
    const genericEvents = ["scroll", "click", "touchstart"];
    
    specificEvents.forEach((evt) => window.addEventListener(evt, handleActivityObj));
    genericEvents.forEach((evt) => window.addEventListener(evt, handleActivity));
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleActivity);

    handleActivity();

    return () => {
      specificEvents.forEach((evt) => window.removeEventListener(evt, handleActivityObj));
      genericEvents.forEach((evt) => window.removeEventListener(evt, handleActivity));
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleActivity);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      
      // Attempt to immediately fire pause on unmount and send any final straggling counts
      if (isActiveRef.current) {
        isActiveRef.current = false;
        onActiveStatusChangeRef.current(false, { ...countsRef.current });
      }
    };
  }, [idleTimeoutMs]);

  return null;
}
