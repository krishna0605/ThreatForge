'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

interface UseIdleTimeoutOptions {
  timeoutMinutes: number;
  warningMinutes?: number; // Show warning this many minutes before timeout
  onTimeout: () => void;
  enabled?: boolean;
}

export function useIdleTimeout({
  timeoutMinutes,
  warningMinutes = 1,
  onTimeout,
  enabled = true,
}: UseIdleTimeoutOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const showWarningRef = useRef(showWarning);

  useEffect(() => {
    showWarningRef.current = showWarning;
  }, [showWarning]);

  const clearAllTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setShowWarning(false);
  }, []);

  const resetTimer = useCallback(() => {
    if (!enabled) return;
    clearAllTimers();

    const timeoutMs = timeoutMinutes * 60 * 1000;
    const warningMs = (timeoutMinutes - warningMinutes) * 60 * 1000;

    // Set warning timer
    if (warningMinutes > 0 && warningMs > 0) {
      warningRef.current = setTimeout(() => {
        setShowWarning(true);
        setRemainingSeconds(warningMinutes * 60);
        countdownRef.current = setInterval(() => {
          setRemainingSeconds(prev => {
            if (prev <= 1) {
              if (countdownRef.current) clearInterval(countdownRef.current);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }, warningMs);
    }

    // Set actual timeout
    timeoutRef.current = setTimeout(() => {
      clearAllTimers();
      onTimeout();
    }, timeoutMs);
  }, [enabled, timeoutMinutes, warningMinutes, onTimeout, clearAllTimers]);

  const dismissWarning = useCallback(() => {
    setShowWarning(false);
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    if (!enabled) {

      return;
    }

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    const handleActivity = () => {
      if (!showWarningRef.current) resetTimer();
    };

    events.forEach(event => window.addEventListener(event, handleActivity, { passive: true }));
    
    // Defer initial timer reset to avoid setting state during render
    const timerId = setTimeout(() => resetTimer(), 0);

    return () => {
      clearTimeout(timerId);
      events.forEach(event => window.removeEventListener(event, handleActivity));
      clearAllTimers();
    };
  }, [enabled, resetTimer, clearAllTimers]);

  return { showWarning, remainingSeconds, dismissWarning };
}
