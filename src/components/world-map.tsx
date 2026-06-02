"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Signal } from "@/types";

const WORLD_PATHS = [
  "M115,95 L130,85 L145,78 L160,75 L175,80 L185,90 L195,85 L210,90 L215,100 L205,110 L195,120 L185,130 L175,140 L165,150 L155,155 L145,160 L135,165 L125,158 L120,150 L115,140 L110,130 L108,120 L110,110 Z",
  "M170,195 L180,190 L195,195 L205,210 L210,225 L215,240 L218,260 L215,280 L210,295 L200,310 L190,320 L180,325 L175,315 L170,300 L165,280 L160,260 L158,240 L160,220 L165,205 Z",
  "M370,75 L380,70 L395,68 L410,72 L420,78 L425,85 L420,95 L410,100 L400,105 L390,102 L380,98 L375,90 L370,82 Z",
  "M370,135 L380,128 L395,125 L410,130 L420,140 L425,155 L430,175 L428,195 L420,215 L410,230 L400,240 L390,245 L380,240 L370,230 L365,215 L360,195 L358,175 L360,155 L365,142 Z",
  "M430,60 L450,55 L480,50 L510,48 L540,50 L570,55 L600,60 L630,65 L650,75 L660,85 L655,100 L645,110 L630,118 L610,122 L590,125 L570,128 L550,130 L530,128 L510,125 L490,120 L475,115 L460,108 L445,100 L435,90 L430,78 Z",
  "M570,145 L585,140 L600,142 L615,148 L625,155 L630,165 L625,172 L615,175 L600,178 L590,180 L580,175 L572,165 L570,155 Z",
  "M610,230 L630,225 L650,228 L665,235 L675,248 L678,260 L672,275 L660,285 L645,290 L630,288 L618,280 L610,268 L605,255 L608,240 Z",
  "M650,80 L658,78 L662,85 L660,92 L655,95 L650,90 Z",
  "M360,72 L365,68 L370,70 L368,76 L363,78 L358,75 Z",
  "M425,105 L440,100 L455,105 L460,115 L455,125 L445,130 L435,128 L428,120 L425,112 Z",
  "M140,165 L148,162 L155,165 L160,172 L155,178 L148,180 L142,175 Z",
  "M690,290 L695,285 L700,290 L698,298 L693,300 L688,296 Z",
  "M435,240 L440,235 L445,240 L443,252 L438,255 L433,250 Z",
  "M225,40 L240,35 L260,38 L270,48 L265,58 L250,62 L235,58 L228,50 Z",
  "M385,45 L392,40 L400,42 L405,52 L402,62 L395,66 L388,62 L385,52 Z",
];

function geoToSvg(lat: number, lng: number): { x: number; y: number } {
  const x = ((lng + 180) / 360) * 800;
  const latRad = (Math.max(-80, Math.min(80, lat)) * Math.PI) / 180;
  const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  const y = 200 - (800 * mercN) / (2 * Math.PI);
  return { x, y };
}

function dotOpacity(createdAt: string): number {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  const maxAge = 24 * 60 * 60 * 1000;
  if (ageMs <= 0) return 1;
  if (ageMs >= maxAge) return 0.05;
  return 1 - (ageMs / maxAge) * 0.95;
}

function dotRadius(createdAt: string): number {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  if (ageMs < 5 * 60 * 1000) return 4;
  if (ageMs < 60 * 60 * 1000) return 3;
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
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    supabase
      .from("signals")
      .select("id, latitude, longitude, created_at, display_name, country_name")
      .eq("season", season)
      .not("latitude", "is", null)
      .not("longitude", "is", null)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(500)
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
          SIGNAL MAP — LAST 24H
          {signals.length > 0 && ` — ${signals.length} SIGNAL${signals.length !== 1 ? "S" : ""}`}
        </span>
      </div>

      <div className="relative w-full bg-bg-surface border border-border rounded-lg overflow-hidden">
        <svg
          viewBox="0 0 800 400"
          className="w-full h-auto"
          xmlns="http://www.w3.org/2000/svg"
        >
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <line key={`v${i}`} x1={i * 100} y1={0} x2={i * 100} y2={400} stroke="currentColor" strokeOpacity={0.04} strokeWidth={0.5} />
          ))}
          {[1, 2, 3].map((i) => (
            <line key={`h${i}`} x1={0} y1={i * 100} x2={800} y2={i * 100} stroke="currentColor" strokeOpacity={0.04} strokeWidth={0.5} />
          ))}

          {WORLD_PATHS.map((d, i) => (
            <path key={i} d={d} fill="rgba(148,163,184,0.08)" stroke="rgba(148,163,184,0.2)" strokeWidth={0.8} />
          ))}

          {[...signals].reverse().map((signal) => {
            const { x, y } = geoToSvg(signal.latitude, signal.longitude);
            const opacity = dotOpacity(signal.created_at);
            const r = dotRadius(signal.created_at);
            const isRecent = Date.now() - new Date(signal.created_at).getTime() < 60000;

            return (
              <g key={signal.id}>
                <circle cx={x} cy={y} r={r * 3} fill="rgba(34,211,238,0.15)" opacity={opacity} />
                <circle cx={x} cy={y} r={r} fill="#22d3ee" opacity={opacity} />
                {isRecent && (
                  <circle cx={x} cy={y} r={r} fill="none" stroke="#22d3ee" strokeWidth={1} className="animate-dot-ping" />
                )}
              </g>
            );
          })}

          {signals.length === 0 && (
            <text x={400} y={200} textAnchor="middle" fill="rgba(148,163,184,0.3)" fontSize={12} fontFamily="monospace">
              AWAITING SIGNALS...
            </text>
          )}
        </svg>
      </div>
    </div>
  );
}
