const COUNTRY_NAMES: Record<string, string> = {
  AF: "Afghanistan", AL: "Albania", DZ: "Algeria", AR: "Argentina",
  AU: "Australia", AT: "Austria", BD: "Bangladesh", BE: "Belgium",
  BR: "Brazil", CA: "Canada", CL: "Chile", CN: "China",
  CO: "Colombia", HR: "Croatia", CZ: "Czech Republic", DK: "Denmark",
  EG: "Egypt", FI: "Finland", FR: "France", DE: "Germany",
  GR: "Greece", HK: "Hong Kong", HU: "Hungary", IN: "India",
  ID: "Indonesia", IR: "Iran", IQ: "Iraq", IE: "Ireland",
  IL: "Israel", IT: "Italy", JP: "Japan", KR: "South Korea",
  MY: "Malaysia", MX: "Mexico", MA: "Morocco", NL: "Netherlands",
  NZ: "New Zealand", NG: "Nigeria", NO: "Norway", PK: "Pakistan",
  PE: "Peru", PH: "Philippines", PL: "Poland", PT: "Portugal",
  RO: "Romania", RU: "Russia", SA: "Saudi Arabia", SG: "Singapore",
  ZA: "South Africa", ES: "Spain", SE: "Sweden", CH: "Switzerland",
  TW: "Taiwan", TH: "Thailand", TR: "Turkey", UA: "Ukraine",
  AE: "UAE", GB: "United Kingdom", US: "United States", VN: "Vietnam",
};

export function getCountryName(code: string | null): string {
  if (!code) return "Unknown";
  return COUNTRY_NAMES[code.toUpperCase()] || code.toUpperCase();
}

export function countryCodeToFlag(code: string | null): string {
  if (!code || code.length !== 2) return "🌍";
  const offset = 127397;
  return String.fromCodePoint(
    ...code
      .toUpperCase()
      .split("")
      .map((c) => c.charCodeAt(0) + offset)
  );
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1"
  );
}

export async function hashIp(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + (process.env.IP_HASH_SALT || "the-last-human"));
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
