import { type NextResponse } from "next/server";

const SUPABASE_AUTH_COOKIE_RE = /^sb-[a-z0-9]+-auth-token/;

export function getSupabaseProjectRef(): string {
  return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split(".")[0];
}

/**
 * Expire Supabase auth cookies from other projects on localhost.
 * Browsers reuse cookies per host, so tokens from other apps accumulate and
 * can push request headers past Node's default 16 KB limit (HTTP 431).
 */
export function pruneStaleSupabaseAuthCookies(
  requestCookies: { name: string }[],
  response: NextResponse,
  projectRef = getSupabaseProjectRef(),
) {
  const keepPrefix = `sb-${projectRef}-auth-token`;

  for (const { name } of requestCookies) {
    if (SUPABASE_AUTH_COOKIE_RE.test(name) && !name.startsWith(keepPrefix)) {
      response.cookies.delete(name);
    }
  }
}
