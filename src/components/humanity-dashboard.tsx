"use client";

import { useTimer } from "@/hooks/use-timer";
import { StatusHeader } from "./status-header";
import { CountdownTimer } from "./countdown-timer";
import { SignalButton } from "./signal-button";
import { LastSignal } from "./last-signal";
import { WorldMap } from "./world-map";
import { ExtinctionMemorial } from "./extinction-memorial";
import type { TimerState, Signal } from "@/types";

export function HumanityDashboard({
  initialTimerState,
  initialLastSignal,
  initialTotalSignals,
}: {
  initialTimerState: TimerState;
  initialLastSignal: Signal | null;
  initialTotalSignals: number;
}) {
  const timer = useTimer(initialTimerState);

  if (timer.status === "extinct") {
    return (
      <ExtinctionMemorial
        timer={timer}
        lastSignal={initialLastSignal}
        totalSignals={initialTotalSignals}
      />
    );
  }

  return (
    <>
      <StatusHeader status="alive" />
      <CountdownTimer deadline={timer.deadline} season={timer.season} />
      <SignalButton />

      {/* Map + Stats row: side by side on desktop, stacked on mobile */}
      <div className="w-full flex flex-col md:flex-row md:items-start gap-4 mt-2">
        <div className="flex-1 min-w-0">
          <WorldMap season={timer.season} />
        </div>
        <div className="md:w-52 flex-shrink-0 flex flex-col items-center justify-center">
          <LastSignal
            initialLastSignal={initialLastSignal}
            initialTotalSignals={initialTotalSignals}
            season={timer.season}
          />
        </div>
      </div>
    </>
  );
}
