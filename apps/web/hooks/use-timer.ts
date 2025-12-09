"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useTimer() {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const rafRef = useRef<number | null>(null);
  const baseElapsedRef = useRef(0); // accumulated when paused
  const startedAtRef = useRef<number | null>(null);

  const loop = useCallback(
    (t: number) => {
      if (!isRunning) return;
      if (startedAtRef.current == null) startedAtRef.current = t;
      const current = baseElapsedRef.current + (t - startedAtRef.current);
      setElapsedMs(current);
      rafRef.current = requestAnimationFrame(loop);
    },
    [isRunning],
  );

  const start = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    startedAtRef.current = performance.now();
    rafRef.current = requestAnimationFrame(loop);
  }, [isRunning, loop]);

  const pause = useCallback(() => {
    if (!isRunning) return;
    setIsRunning(false);
    if (startedAtRef.current != null) {
      baseElapsedRef.current += performance.now() - startedAtRef.current;
      startedAtRef.current = null;
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, [isRunning]);

  const reset = useCallback(() => {
    setIsRunning(false);
    baseElapsedRef.current = 0;
    startedAtRef.current = null;
    setElapsedMs(0);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  // safety cleanup
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const seconds = elapsedMs / 1000;

  return { elapsedMs, seconds, isRunning, start, pause, reset };
}
