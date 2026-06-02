"use client";

import { useCountdown } from "@/hooks/use-countdown";

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function getTimerColor(totalMs: number): {
  textClass: string;
  glowClass: string;
  label: string;
} {
  const oneHour = 3600 * 1000;
  const fiveMin = 5 * 60 * 1000;

  if (totalMs <= 0) {
    return { textClass: "text-accent-red", glowClass: "glow-red", label: "CRITICAL" };
  }
  if (totalMs <= fiveMin) {
    return {
      textClass: "text-accent-red animate-pulse-glow",
      glowClass: "glow-red",
      label: "CRITICAL",
    };
  }
  if (totalMs <= oneHour) {
    return { textClass: "text-accent-amber", glowClass: "glow-amber", label: "WARNING" };
  }
  return { textClass: "text-primary", glowClass: "glow-primary", label: "STABLE" };
}

export function CountdownTimer({
  deadline,
  season,
}: {
  deadline: string;
  season: number;
}) {
  const countdown = useCountdown(deadline);
  const { textClass, glowClass, label } = getTimerColor(countdown.totalMs);

  return (
    <div className="flex flex-col items-center gap-2 mb-4">
      <div className="flex items-center gap-2">
        <span className="text-[9px] tracking-[0.3em] uppercase text-text-muted">
          TIME REMAINING
        </span>
        <span
          className={`text-[9px] tracking-[0.2em] uppercase px-1.5 py-0.5 border ${
            label === "STABLE"
              ? "border-primary/30 text-primary"
              : label === "WARNING"
              ? "border-accent-amber/30 text-accent-amber"
              : "border-accent-red/30 text-accent-red"
          }`}
        >
          {label}
        </span>
      </div>

      <div className={`${textClass} ${glowClass} font-bold`}>
        <span className="text-4xl md:text-6xl tracking-wider font-mono">
          {pad(countdown.hours)}:{pad(countdown.minutes)}:{pad(countdown.seconds)}
        </span>
      </div>

      <div className="text-[9px] tracking-[0.3em] uppercase text-text-dim">
        SEASON {season}
      </div>
    </div>
  );
}
