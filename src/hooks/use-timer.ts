"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { TimerState } from "@/types";

export function useTimer(initialState: TimerState) {
  const [timer, setTimer] = useState<TimerState>(initialState);
  const channelRef = useRef<string>(
    `timer_state_${Date.now()}_${Math.random().toString(36).slice(2)}`
  );

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    const channel = supabase
      .channel(channelRef.current)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "timer_state",
          filter: "id=eq.1",
        },
        (payload: { new: Record<string, unknown> }) => {
          setTimer(payload.new as unknown as TimerState);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return timer;
}
