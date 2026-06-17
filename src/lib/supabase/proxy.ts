import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { pruneStaleSupabaseAuthCookies } from "@/lib/supabase/cookie-cleanup";

/**
 * Refreshes the Supabase auth session on every matched request and keeps the
 * auth cookies in sync between request and response.
 *
 * IMPORTANT: only do an "optimistic" auth check here (is there a user?).
 * Authoritative authorization (roles, tenancy) belongs in the Data Access
 * Layer / Server Components — see Next.js proxy security guidance.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and getUser() — it can cause
  // hard-to-debug session termination issues.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Optimistic route protection only. Authoritative authz (roles, tenancy)
  // lives in the Data Access Layer (src/lib/auth/dal.ts).
  const { pathname } = request.nextUrl;
  const isProtected = pathname.startsWith("/admin");
  const isAuthPage =
    pathname === "/prihlasenie" || pathname === "/registracia";

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/prihlasenie";
    url.searchParams.set("redirect", pathname);
    return finishResponse(request, redirectKeepingCookies(url, supabaseResponse));
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return finishResponse(request, redirectKeepingCookies(url, supabaseResponse));
  }

  // Must return supabaseResponse as-is so cookies stay in sync. If you build a
  // new response, copy over supabaseResponse.cookies first.
  return finishResponse(request, supabaseResponse);
}

function finishResponse(request: NextRequest, response: NextResponse) {
  pruneStaleSupabaseAuthCookies(request.cookies.getAll(), response);
  return response;
}

/** Redirect while preserving the refreshed Supabase auth cookies. */
function redirectKeepingCookies(url: URL, from: NextResponse): NextResponse {
  const response = NextResponse.redirect(url);
  from.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie);
  });
  return response;
}
