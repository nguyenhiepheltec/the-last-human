import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { TIMER_DURATION_MS } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { secret } = body;

    if (secret !== process.env.ADMIN_RESET_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseServiceClient();

    // Get current season
    const { data: current } = await supabase
      .from("timer_state")
      .select("season")
      .eq("id", 1)
      .single();

    const newSeason = (current?.season || 1) + 1;
    const newDeadline = new Date(Date.now() + TIMER_DURATION_MS).toISOString();

    const { data: timer, error } = await supabase
      .from("timer_state")
      .update({
        deadline: newDeadline,
        status: "alive",
        season: newSeason,
        last_reset_by: null,
        last_reset_at: new Date().toISOString(),
      })
      .eq("id", 1)
      .select()
      .single();

    if (error) {
      console.error("Admin reset error:", error);
      return NextResponse.json(
        { error: "Failed to reset" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, timer });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
