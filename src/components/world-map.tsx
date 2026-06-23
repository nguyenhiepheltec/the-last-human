"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { WORLD_PATHS, MAP_WIDTH, MAP_HEIGHT, LAT_MIN, LAT_MAX } from "@/lib/world-paths";
import type { Signal } from "@/types";

function latToMercY(lat: number): number {
  const latRad = (lat * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + latRad / 2));
}

const yTop = latToMercY(LAT_MAX);
const yBot = latToMercY(LAT_MIN);

function geoToSvg(lat: number, lng: number): { x: number; y: number } {
  const clampedLat = Math.max(LAT_MIN, Math.min(LAT_MAX, lat));
  const x = ((lng + 180) / 360) * MAP_WIDTH;
  const mercY = latToMercY(clampedLat);
  const y = ((yTop - mercY) / (yTop - yBot)) * MAP_HEIGHT;
  return { x: Math.round(x), y: Math.round(y) };
}

function dotOpacity(createdAt: string): number {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  const maxAge = 7 * 24 * 60 * 60 * 1000;
  if (ageMs <= 0) return 1;
  if (ageMs >= maxAge) return 0.05;
  return 1 - (ageMs / maxAge) * 0.95;
}

function dotRadius(createdAt: string): number {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  if (ageMs < 5 * 60 * 1000) return 5;
  if (ageMs < 60 * 60 * 1000) return 3.5;
  if (ageMs < 24 * 60 * 60 * 1000) return 2.5;
  return 2;
}

interface MapSignal {
  id: string;
  latitude: number;
  longitude: number;
  created_at: string;
  display_name: string;
  country_name: string | null;
}

export function WorldMap({ season }: { season: number }) {
  const [signals, setSignals] = useState<MapSignal[]>([]);
  const [, setTick] = useState(0);
  const channelRef = useRef<string>(
    `map_signals_${Date.now()}_${Math.random().toString(36).slice(2)}`
  );

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    supabase
      .from("signals")
      .select("id, latitude, longitude, created_at, display_name, country_name")
      .eq("season", season)
      .not("latitude", "is", null)
      .not("longitude", "is", null)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(2000)
      .then(({ data }: { data: MapSignal[] | null }) => {
        if (data) setSignals(data);
      });
  }, [season]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    const channel = supabase
      .channel(channelRef.current)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "signals" },
        (payload: { new: Record<string, unknown> }) => {
          const s = payload.new as unknown as Signal;
          if (s.latitude != null && s.longitude != null && s.season === season) {
            setSignals((prev) => [
              {
                id: s.id,
                latitude: s.latitude!,
                longitude: s.longitude!,
                created_at: s.created_at,
                display_name: s.display_name,
                country_name: s.country_name,
              },
              ...prev.slice(0, 499),
            ]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [season]);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full">
      <div className="text-center mb-1.5">
        <span className="text-[9px] tracking-[0.3em] uppercase text-text-dim">
          SIGNAL MAP — LAST 7 DAYS
          {signals.length > 0 && ` — ${signals.length} SIGNAL${signals.length !== 1 ? "S" : ""}`}
        </span>
      </div>

      <div className="relative w-full bg-bg-surface/50 border border-border rounded-lg overflow-hidden">
        <svg
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          className="w-full h-auto block"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="dot-glow">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Country outlines */}
          {WORLD_PATHS.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="rgba(148, 163, 184, 0.06)"
              stroke="rgba(148, 163, 184, 0.15)"
              strokeWidth={0.5}
              strokeLinejoin="round"
            />
          ))}

          {/* Signal dots */}
          {[...signals].reverse().map((signal) => {
            const { x, y } = geoToSvg(signal.latitude, signal.longitude);
            const opacity = dotOpacity(signal.created_at);
            const r = dotRadius(signal.created_at);
            const isRecent = Date.now() - new Date(signal.created_at).getTime() < 60000;

            return (
              <g key={signal.id}>
                <circle cx={x} cy={y} r={r * 4} fill="url(#dot-glow)" opacity={opacity * 0.5} />
                <circle cx={x} cy={y} r={r} fill="#22d3ee" opacity={opacity} />
                <circle cx={x} cy={y} r={r * 0.4} fill="#ffffff" opacity={opacity * 0.8} />
                {isRecent && (
                  <circle
                    cx={x} cy={y} r={r}
                    fill="none" stroke="#22d3ee" strokeWidth={1.5}
                    className="animate-dot-ping"
                  />
                )}
              </g>
            );
          })}

          {signals.length === 0 && (
            <text x={MAP_WIDTH / 2} y={MAP_HEIGHT / 2} textAnchor="middle" fill="rgba(148,163,184,0.3)" fontSize={12} fontFamily="monospace">
              AWAITING SIGNALS...
            </text>
          )}
        </svg>
      </div>
    </div>
  );
}
