export interface TimerState {
  id: number;
  deadline: string;
  status: "alive" | "extinct";
  season: number;
  last_reset_by: string | null;
  last_reset_at: string;
  created_at: string;
}

export interface Signal {
  id: string;
  display_name: string;
  country_code: string | null;
  country_name: string | null;
  latitude: number | null;
  longitude: number | null;
  ip_hash: string;
  season: number;
  created_at: string;
}

export interface SignalStats {
  season: number;
  total_signals: number;
  unique_humans: number;
  last_signal_at: string | null;
}
