import { createClient } from "@supabase/supabase-js";
import { HumanityDashboard } from "@/components/humanity-dashboard";
import type { TimerState, Signal } from "@/types";

async function getData() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [timerResult, lastSignalResult, statsResult] = await Promise.all([
    supabase.from("timer_state").select("*").eq("id", 1).single(),
    supabase
      .from("signals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("signal_stats").select("*").limit(1).maybeSingle(),
  ]);

  return {
    timerState: timerResult.data as TimerState | null,
    lastSignal: lastSignalResult.data as Signal | null,
    totalSignals: (statsResult.data?.total_signals as number) || 0,
  };
}

// Revalidate every 10 seconds for fresh SSR data
export const revalidate = 10;

export default async function Home() {
  const { timerState, lastSignal, totalSignals } = await getData();

  // Fallback timer state for development without Supabase
  const fallbackTimer: TimerState = {
    id: 1,
    deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    status: "alive",
    season: 1,
    last_reset_by: null,
    last_reset_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  const timer = timerState || fallbackTimer;

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-3 md:p-6 min-h-screen">
      <div className="flex flex-col items-center gap-1 w-full max-w-4xl">
        <HumanityDashboard
          initialTimerState={timer}
          initialLastSignal={lastSignal}
          initialTotalSignals={totalSignals}
        />

        <footer className="mt-4 text-center">
          <p className="text-[8px] tracking-[0.3em] text-text-dim/40 uppercase">
            THE LAST HUMAN — SEASON {timer.season}
          </p>
        </footer>
      </div>
    </main>
  );
}
