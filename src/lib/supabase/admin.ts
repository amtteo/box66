import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Admin (service-role) Supabase klient. Obchádza RLS a má prístup k Auth Admin
 * API. POUŽÍVAJ VÝHRADNE server-side (Server Actions / Route Handlers) — nikdy
 * ho neposielaj do prehliadača. Drží sa `SUPABASE_SECRET_KEY` (sb_secret_...).
 */
export function createAdminClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Chýba SUPABASE_SECRET_KEY v prostredí.");
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
