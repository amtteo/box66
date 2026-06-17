/** Bezpečný interný redirect — len relatívne cesty, žiadne open redirecty. */
export function safeRedirectPath(
  raw: unknown,
  fallback = "/",
): string {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//")) {
    return fallback;
  }
  if (raw.includes("://")) return fallback;
  return raw;
}
