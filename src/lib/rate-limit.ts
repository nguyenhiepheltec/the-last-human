import { SupabaseClient } from "@supabase/supabase-js";
import { RATE_LIMIT_WINDOW_MS } from "./constants";

export async function checkRateLimit(
  supabase: SupabaseClient,
  ipHash: string,
  season: number
): Promise<{ allowed: boolean; retryAfterMs: number }> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();

  const { data } = await supabase
    .from("signals")
    .select("created_at")
    .eq("ip_hash", ipHash)
    .eq("season", season)
    .gte("created_at", windowStart)
    .order("created_at", { ascending: false })
    .limit(1);

  if (data && data.length > 0) {
    const lastSignalTime = new Date(data[0].created_at).getTime();
    const retryAfterMs =
      RATE_LIMIT_WINDOW_MS - (Date.now() - lastSignalTime);
    return { allowed: false, retryAfterMs: Math.max(0, retryAfterMs) };
  }

  return { allowed: true, retryAfterMs: 0 };
}
