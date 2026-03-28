"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Hook to detect user friction (inactivity or slowing down).
 * Triggers a callback when inactivity breaches the threshold.
 */
export function useInactivityDetector(
  timeoutSeconds: number,
  onFrictionDetected: () => void,
  enabled: boolean = true
) {
  const [inactiveTime, setInactiveTime] = useState(0);
  const callbackRef = useRef(onFrictionDetected);
  
  // Keep callback ref fresh so we don't need it in dependency array
  useEffect(() => {
    callbackRef.current = onFrictionDetected;
  }, [onFrictionDetected]);

  const resetTimer = useCallback(() => {
    setInactiveTime(0);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Events that count as "activity"
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    
    events.forEach(event => document.addEventListener(event, resetTimer));

    const interval = setInterval(() => {
      setInactiveTime(prev => {
        const next = prev + 1;
        if (next === timeoutSeconds) {
          callbackRef.current();
        }
        return next;
      });
    }, 1000);

    return () => {
      events.forEach(event => document.removeEventListener(event, resetTimer));
      clearInterval(interval);
    };
  }, [enabled, timeoutSeconds, resetTimer]);

  return { inactiveTime, resetTimer };
}
