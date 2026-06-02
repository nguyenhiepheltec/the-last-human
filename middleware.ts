import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Extract country from Vercel's geo headers (available in Vercel deployment)
  const country =
    (request as NextRequest & { geo?: { country?: string } }).geo?.country ||
    null;
  if (country) {
    response.headers.set("x-country-code", country);
  }

  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
