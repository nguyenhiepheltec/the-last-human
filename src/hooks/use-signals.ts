"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Signal } from "@/types";

interface SignalData {
  lastSignal: Signal | null;
  totalSignals: number;
}

export function useSignals(
  initialLastSignal: Signal | null,
  initialTotalSignals: number,
  season: number
) {
  const [data, setData] = useState<SignalData>({
    lastSignal: initialLastSignal,
    totalSignals: initialTotalSignals,
  });
  const channelRef = useRef<string>(
    `signals_${Date.now()}_${Math.random().toString(36).slice(2)}`
  );

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    const channel = supabase
      .channel(channelRef.current)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "signals",
        },
        (payload: { new: Record<string, unknown> }) => {
          const newSignal = payload.new as unknown as Signal;
          if (newSignal.season === season) {
            setData((prev) => ({
              lastSignal: newSignal,
              totalSignals: prev.totalSignals + 1,
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [season]);

  return data;
}
