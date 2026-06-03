"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { TurnstileWidget } from "./turnstile-widget";
import { MAX_NAME_LENGTH, RATE_LIMIT_WINDOW_MS } from "@/lib/constants";

type ButtonState = "idle" | "loading" | "success" | "rate-limited" | "error";

export function SignalButton() {
  const [name, setName] = useState("");
  const [buttonState, setButtonState] = useState<ButtonState>("idle");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [retryAfterMs, setRetryAfterMs] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isRateLimited = buttonState === "rate-limited";

  useEffect(() => {
    if (!isRateLimited || retryAfterMs <= 0) return;

    intervalRef.current = setInterval(() => {
      setRetryAfterMs((prev) => {
        const next = prev - 1000;
        if (next <= 0) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setButtonState("idle");
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRateLimited]);

  const resetTurnstile = useCallback(() => {
    setTurnstileToken(null);
    setTurnstileKey((k) => k + 1);
  }, []);

  const handleSignal = useCallback(async () => {
    if (buttonState === "loading") return;

    setButtonState("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: name || "Anonymous",
          turnstile_token: turnstileToken,
        }),
      });

      // Reset turnstile to get a fresh token for next submission
      resetTurnstile();

      if (res.status === 429) {
        const data = await res.json();
        setRetryAfterMs(data.retryAfterMs || 0);
        setButtonState("rate-limited");
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        setErrorMsg(data.error || "Something went wrong");
        setButtonState("error");
        return;
      }

      setButtonState("success");
      setTimeout(() => setButtonState("idle"), 2000);
    } catch {
      setErrorMsg("Network error. Try again.");
      setButtonState("error");
    }
  }, [buttonState, name, turnstileToken, resetTurnstile]);

  const formatRetry = (ms: number) => {
    const min = Math.ceil(ms / 1000);
    return `${min} seconds`;
  };

  return (
    <div className="flex flex-col items-center gap-3 mb-2 w-full max-w-xs">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value.slice(0, MAX_NAME_LENGTH))}
        placeholder="YOUR NAME (OPTIONAL)"
        className="w-full bg-bg-surface border border-border text-text text-center text-[10px] tracking-[0.2em] uppercase py-2 px-3 rounded placeholder:text-text-dim focus:outline-none focus:border-primary/50 transition-colors font-mono"
      />

      <button
        onClick={handleSignal}
        disabled={
          buttonState === "loading" || buttonState === "rate-limited"
        }
        className={`
          w-full py-3 px-6 text-xs md:text-sm tracking-[0.3em] uppercase font-bold
          border-2 rounded transition-all duration-300 font-mono
          ${
            buttonState === "success"
              ? "border-primary bg-primary/20 text-primary glow-primary animate-button-flash"
              : buttonState === "rate-limited"
              ? "border-accent-amber/40 text-accent-amber/50 cursor-not-allowed"
              : buttonState === "loading"
              ? "border-primary/30 text-primary/50 cursor-wait"
              : buttonState === "error"
              ? "border-accent-red text-accent-red"
              : "border-primary text-primary hover:bg-primary/10 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] active:bg-primary/20 cursor-pointer"
          }
          disabled:cursor-not-allowed
        `}
      >
        {buttonState === "loading"
          ? "TRANSMITTING..."
          : buttonState === "success"
          ? "SIGNAL RECEIVED"
          : buttonState === "rate-limited"
          ? `WAIT ${formatRetry(retryAfterMs)}`
          : buttonState === "error"
          ? "TRANSMISSION FAILED"
          : "I'M STILL HERE"}
      </button>

      {buttonState === "error" && errorMsg && (
        <p className="text-accent-red text-[9px] tracking-[0.2em] uppercase">
          {errorMsg}
        </p>
      )}

      {buttonState === "rate-limited" && (
        <p className="text-accent-amber text-[9px] tracking-[0.2em] uppercase text-center">
          COOLDOWN — ONE SIGNAL PER {RATE_LIMIT_WINDOW_MS / 1000} SECONDS
        </p>
      )}

      <TurnstileWidget key={turnstileKey} onVerify={setTurnstileToken} />
    </div>
  );
}
