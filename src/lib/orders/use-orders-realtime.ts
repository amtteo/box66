"use client";

import { useEffect, useRef } from "react";

import { createClient } from "@/lib/supabase/client";
import { playOrderChime } from "@/lib/orders/order-chime";
import { shouldPlayOrderChime } from "@/lib/orders/should-play-order-chime";

type RealtimePayload = {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: Record<string, unknown> | null;
  old: Record<string, unknown> | null;
};

type UseOrdersRealtimeOptions = {
  storeId: string;
  enabled?: boolean;
  /** Volá sa po debounce pri zmene objednávky (typicky refresh z API/Prisma). */
  onRefresh: () => void | Promise<void>;
  /** Pre KDS — zvuk pri novej / potvrdenej objednávke. */
  playChime?: boolean;
};

const REFRESH_DEBOUNCE_MS = 400;
const FALLBACK_POLL_MS = 60_000;

/**
 * Supabase Realtime na tabuľke orders + záložný polling.
 * Nahradí 15s polling pri živých aktualizáciách z webu, POS alebo API.
 */
export function useOrdersRealtime({
  storeId,
  enabled = true,
  onRefresh,
  playChime = false,
}: UseOrdersRealtimeOptions): void {
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    if (!enabled || !storeId) return;

    let cancelled = false;
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;

    const scheduleRefresh = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (!cancelled) void onRefreshRef.current();
      }, REFRESH_DEBOUNCE_MS);
    };

    const handlePayload = (payload: RealtimePayload) => {
      if (playChime) {
        const record = payload.new as { status?: string } | null;
        const oldRecord = payload.old as { status?: string } | null;
        if (shouldPlayOrderChime(payload.eventType, record, oldRecord)) {
          playOrderChime();
        }
      }
      scheduleRefresh();
    };

    const supabase = createClient();
    const channel = supabase
      .channel(`store-orders:${storeId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `storeId=eq.${storeId}`,
        },
        (payload) => handlePayload(payload as RealtimePayload),
      )
      .subscribe();

    const fallbackInterval = window.setInterval(() => {
      if (!cancelled) void onRefreshRef.current();
    }, FALLBACK_POLL_MS);

    return () => {
      cancelled = true;
      if (debounceTimer) clearTimeout(debounceTimer);
      window.clearInterval(fallbackInterval);
      void supabase.removeChannel(channel);
    };
  }, [enabled, playChime, storeId]);
}
