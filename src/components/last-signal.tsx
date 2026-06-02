"use client";

import { useEffect, useState } from "react";
import { useSignals } from "@/hooks/use-signals";
import { countryCodeToFlag } from "@/lib/geo";
import type { Signal } from "@/types";

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 5) return "JUST NOW";
  if (seconds < 60) return `${seconds}s AGO`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m AGO`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h AGO`;
  const days = Math.floor(hours / 24);
  return `${days}d AGO`;
}

export function LastSignal({
  initialLastSignal,
  initialTotalSignals,
  season,
}: {
  initialLastSignal: Signal | null;
  initialTotalSignals: number;
  season: number;
}) {
  const { lastSignal, totalSignals } = useSignals(
    initialLastSignal,
    initialTotalSignals,
    season
  );
  const [agoText, setAgoText] = useState(
    lastSignal ? timeAgo(lastSignal.created_at) : ""
  );

  useEffect(() => {
    if (!lastSignal) return;
    setAgoText(timeAgo(lastSignal.created_at));
    const interval = setInterval(() => {
      setAgoText(timeAgo(lastSignal.created_at));
    }, 1000);
    return () => clearInterval(interval);
  }, [lastSignal]);

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Total Signals */}
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[9px] tracking-[0.3em] uppercase text-text-dim">
          TOTAL SIGNALS
        </span>
        <span className="text-xl md:text-2xl font-bold text-primary glow-primary tracking-wider">
          {totalSignals.toLocaleString()}
        </span>
      </div>

      {/* Last Signal */}
      {lastSignal && (
        <div className="flex flex-col items-center gap-1.5 w-full bg-bg-surface border border-border rounded-lg p-3">
          <span className="text-[9px] tracking-[0.3em] uppercase text-text-dim">
            LAST SIGNAL
          </span>
          <div className="flex flex-col items-center gap-0.5 text-text">
            <span className="text-xs font-bold tracking-wider">
              {lastSignal.display_name}
            </span>
            <span className="text-[10px] text-text-muted">
              {countryCodeToFlag(lastSignal.country_code)}{" "}
              {lastSignal.country_name || "Unknown"}
            </span>
          </div>
          <span className="text-[9px] tracking-[0.2em] text-primary-dim">
            {agoText}
          </span>
        </div>
      )}
    </div>
  );
}
