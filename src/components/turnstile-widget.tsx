"use client";

import Turnstile from "react-turnstile";

export function TurnstileWidget({
  onVerify,
}: {
  onVerify: (token: string) => void;
}) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  if (!siteKey) return null;

  return (
    <Turnstile
      sitekey={siteKey}
      onVerify={onVerify}
      theme="dark"
      size="invisible"
    />
  );
}
