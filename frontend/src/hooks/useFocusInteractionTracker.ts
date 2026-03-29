"use client";

import { useCallback, useEffect, useRef } from "react";

export type FocusInteractionSnapshot = {
  tab_changes: number;
  keyboard_inputs: number;
  window_blurs: number;
  mouse_movements: number;
};

/**
 * Counts interaction signals while Focus / the study timer is running.
 * - Tab switches: document becomes hidden (user left the tab).
 * - Window blurs: window loses focus (another app, etc.).
 * - Keys: keydown (ignores key repeat).
 * - Mouse: throttled movement samples (not raw pixel count).
 */
export function useFocusInteractionTracker(active: boolean) {
  const counts = useRef<FocusInteractionSnapshot>({
    tab_changes: 0,
    keyboard_inputs: 0,
    window_blurs: 0,
    mouse_movements: 0,
  });
  const moveGate = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!active) return;

    const onVisibility = () => {
      if (document.hidden) counts.current.tab_changes += 1;
    };

    const onWinBlur = () => {
      counts.current.window_blurs += 1;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      counts.current.keyboard_inputs += 1;
    };

    const onMouseMove = () => {
      if (moveGate.current) return;
      counts.current.mouse_movements += 1;
      moveGate.current = setTimeout(() => {
        moveGate.current = null;
      }, 120);
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onWinBlur);
    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onWinBlur);
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("mousemove", onMouseMove);
      if (moveGate.current) clearTimeout(moveGate.current);
      moveGate.current = null;
    };
  }, [active]);

  const reset = useCallback(() => {
    counts.current = {
      tab_changes: 0,
      keyboard_inputs: 0,
      window_blurs: 0,
      mouse_movements: 0,
    };
  }, []);

  const getSnapshot = useCallback((): FocusInteractionSnapshot => ({ ...counts.current }), []);

  return { reset, getSnapshot };
}
