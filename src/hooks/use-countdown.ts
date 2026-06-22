"use client";

import { useEffect, useState } from "react";

interface CountdownValues {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  isExpired: boolean;
}

export function useCountdown(deadline: string): CountdownValues {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now()); // Set initial value on client only
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // During SSR / first render, show deadline as-is (no countdown yet)
  if (now === null) {
    return { days: 365, hours: 0, minutes: 0, seconds: 0, totalMs: 365 * 24 * 60 * 60 * 1000, isExpired: false };
  }

  const deadlineMs = new Date(deadline).getTime();
  const totalMs = Math.max(0, deadlineMs - now);
  const isExpired = totalMs <= 0;

  const totalSeconds = Math.floor(totalMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, totalMs, isExpired };
}
