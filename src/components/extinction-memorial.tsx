"use client";

import type { TimerState, Signal } from "@/types";

function formatDuration(startDate: string, endDate: string): string {
  const ms = new Date(endDate).getTime() - new Date(startDate).getTime();
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} DAYS`);
  if (hours > 0) parts.push(`${hours} HOURS`);
  if (minutes > 0) parts.push(`${minutes} MINUTES`);
  return parts.join(" ") || "< 1 MINUTE";
}

export function ExtinctionMemorial({
  timer,
  lastSignal,
  totalSignals,
}: {
  timer: TimerState;
  lastSignal: Signal | null;
  totalSignals: number;
}) {
  const survivalDuration = formatDuration(timer.created_at, timer.deadline);

  return (
    <div className="flex flex-col items-center gap-8 text-center animate-[fadeIn_2s_ease-in]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-accent-red" />
        <span className="text-xs tracking-[0.3em] uppercase text-text-muted">
          SYSTEM OFFLINE
        </span>
      </div>

      <h1 className="text-3xl md:text-5xl font-bold tracking-[0.2em] text-accent-red glow-red">
        HUMANITY EXTINCT
      </h1>

      <div className="flex flex-col items-center gap-6 border border-accent-red/30 bg-bg-surface rounded-lg p-6 md:p-8 max-w-md w-full">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] tracking-[0.3em] text-text-dim">
            HUMANITY SURVIVED
          </span>
          <span className="text-xl md:text-2xl font-bold text-accent-red tracking-wider">
            {survivalDuration}
          </span>
        </div>

        <div className="w-full h-px bg-accent-red/20" />

        <div className="flex flex-col gap-1">
          <span className="text-[10px] tracking-[0.3em] text-text-dim">
            TOTAL SIGNALS RECEIVED
          </span>
          <span className="text-xl font-bold text-accent-red tracking-wider">
            {totalSignals.toLocaleString()}
          </span>
        </div>

        {lastSignal && (
          <>
            <div className="w-full h-px bg-accent-red/20" />
            <div className="flex flex-col gap-1">
              <span className="text-[10px] tracking-[0.3em] text-text-dim">
                FINAL SIGNAL
              </span>
              <span className="text-sm text-accent-red tracking-wider">
                {lastSignal.display_name} — {lastSignal.country_name || "Unknown"}
              </span>
              <span className="text-[10px] text-text-dim tracking-wider">
                {new Date(lastSignal.created_at).toUTCString()}
              </span>
            </div>
          </>
        )}

        <div className="w-full h-px bg-accent-red/20" />

        <div className="flex flex-col gap-1">
          <span className="text-[10px] tracking-[0.3em] text-text-dim">
            SEASON {timer.season} ENDED
          </span>
          <span className="text-[10px] text-text-dim tracking-wider">
            {new Date(timer.deadline).toUTCString()}
          </span>
        </div>
      </div>

      <p className="text-xs tracking-[0.2em] text-text-dim uppercase mt-4">
        THE NEXT SEASON WILL BEGIN SOON
      </p>
    </div>
  );
}
