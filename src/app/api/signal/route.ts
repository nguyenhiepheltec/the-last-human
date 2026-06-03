import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp, hashIp, getCountryName } from "@/lib/geo";
import { TIMER_DURATION_MS, MAX_NAME_LENGTH } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { display_name, turnstile_token } = body;

    // Sanitize display name
    const name = (display_name || "Anonymous")
      .trim()
      .slice(0, MAX_NAME_LENGTH) || "Anonymous";

    // Hash IP for rate limiting
    const ip = getClientIp(request);
    const ipHash = await hashIp(ip);

    const supabase = getSupabaseServiceClient();

    // Check timer status
    const { data: timer } = await supabase
      .from("timer_state")
      .select("*")
      .eq("id", 1)
      .single();

    if (!timer || timer.status === "extinct") {
      return NextResponse.json(
        { error: "Humanity is already extinct", timer },
        { status: 409 }
      );
    }

    // Check rate limit BEFORE turnstile (avoid wasting turnstile call when rate-limited)
    const rateLimit = await checkRateLimit(supabase, ipHash, timer.season);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Too many signals. Please wait.",
          retryAfterMs: rateLimit.retryAfterMs,
        },
        { status: 429 }
      );
    }

    // Validate turnstile (after rate limit so we don't waste single-use tokens)
    if (turnstile_token) {
      const valid = await verifyTurnstileToken(turnstile_token);
      if (!valid) {
        return NextResponse.json(
          { error: "Bot verification failed" },
          { status: 403 }
        );
      }
    }

    // Get country + coordinates from Vercel geo headers, fallback to IP lookup
    let countryCode =
      request.headers.get("x-vercel-ip-country") ||
      request.headers.get("x-country-code") ||
      null;
    let latitude: number | null = parseFloat(request.headers.get("x-vercel-ip-latitude") || "") || null;
    let longitude: number | null = parseFloat(request.headers.get("x-vercel-ip-longitude") || "") || null;

    if (!countryCode || latitude === null) {
      try {
        const geoRes = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(3000) });
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          countryCode = countryCode || geoData.country_code || null;
          latitude = latitude ?? (geoData.latitude != null ? Number(geoData.latitude) : null);
          longitude = longitude ?? (geoData.longitude != null ? Number(geoData.longitude) : null);
        }
      } catch {
        // Ignore geo lookup failures
      }
    }

    const countryName = getCountryName(countryCode);

    // Insert signal
    const { data: signal, error: signalError } = await supabase
      .from("signals")
      .insert({
        display_name: name,
        country_code: countryCode,
        country_name: countryName,
        latitude,
        longitude,
        ip_hash: ipHash,
        season: timer.season,
      })
      .select()
      .single();

    if (signalError) {
      console.error("Signal insert error:", signalError);
      return NextResponse.json(
        { error: "Failed to record signal" },
        { status: 500 }
      );
    }

    // Reset timer
    const newDeadline = new Date(Date.now() + TIMER_DURATION_MS).toISOString();
    const { error: timerError } = await supabase
      .from("timer_state")
      .update({
        deadline: newDeadline,
        last_reset_by: signal.id,
        last_reset_at: new Date().toISOString(),
      })
      .eq("id", 1);

    if (timerError) {
      console.error("Timer update error:", timerError);
      return NextResponse.json(
        { error: "Failed to reset timer" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      signal,
      newDeadline,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
