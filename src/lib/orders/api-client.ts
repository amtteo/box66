import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  ApiCreateOrderRequest,
  ApiErrorResponse,
  ApiMenuResponse,
  ApiOrder,
  ApiOrderListResponse,
  ApiOrderStatus,
} from "@/lib/orders/api-types";

export class OrderApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "OrderApiError";
  }
}

/** Order API nie je dostupný (server nebeží, sieť, timeout). */
export class OrderApiUnreachableError extends Error {
  constructor(cause?: unknown) {
    super("Order API nie je dostupný.");
    this.name = "OrderApiUnreachableError";
    this.cause = cause;
  }
}

export function isOrderApiUnreachableError(
  err: unknown,
): err is OrderApiUnreachableError {
  return err instanceof OrderApiUnreachableError;
}

function apiBaseUrl(): string {
  const url = process.env.ORDER_API_URL?.trim();
  if (!url) {
    throw new Error("ORDER_API_URL nie je nastavený.");
  }
  return url.replace(/\/$/, "");
}

export function isOrderApiConfigured(): boolean {
  return Boolean(process.env.ORDER_API_URL?.trim());
}

async function getAccessToken(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    throw new OrderApiError("Nie si prihlásený.", 401);
  }
  return token;
}

async function parseError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as ApiErrorResponse;
    return body.message || body.error || res.statusText;
  } catch {
    return res.statusText || "Chyba Order API";
  }
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${apiBaseUrl()}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
      cache: "no-store",
    });
  } catch (err) {
    throw new OrderApiUnreachableError(err);
  }

  if (!res.ok) {
    throw new OrderApiError(await parseError(res), res.status);
  }

  return (await res.json()) as T;
}

/** Verejné endpointy (menu, vytvorenie objednávky) — bez JWT. */
async function publicApiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  return fetchJson<T>(path, init);
}

async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token = await getAccessToken();
  return fetchJson<T>(path, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });
}

export async function fetchMenuFromApi(storeId: string): Promise<ApiMenuResponse> {
  return publicApiFetch<ApiMenuResponse>(`/stores/${storeId}/menu`);
}

export async function placeOrderViaApi(
  storeId: string,
  body: ApiCreateOrderRequest,
): Promise<ApiOrder> {
  return publicApiFetch<ApiOrder>(`/stores/${storeId}/orders`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function fetchStoreOrdersFromApi(
  storeId: string,
  options?: { status?: ApiOrderStatus; limit?: number },
): Promise<ApiOrder[]> {
  const params = new URLSearchParams();
  if (options?.status) params.set("status", options.status);
  if (options?.limit) params.set("limit", String(options.limit));
  const qs = params.toString();
  const data = await apiFetch<ApiOrderListResponse>(
    `/stores/${storeId}/orders${qs ? `?${qs}` : ""}`,
  );
  return data.orders;
}

export async function patchOrderStatusViaApi(
  orderId: string,
  status: ApiOrderStatus,
  options?: { restoreStock?: boolean; refundedSubtotal?: number },
): Promise<ApiOrder> {
  return apiFetch<ApiOrder>(`/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify({
      status,
      ...(options?.restoreStock !== undefined
        ? { restoreStock: options.restoreStock }
        : {}),
      ...(options?.refundedSubtotal !== undefined
        ? { refundedSubtotal: String(options.refundedSubtotal) }
        : {}),
    }),
  });
}

export async function fetchOrderFromApi(orderId: string): Promise<ApiOrder> {
  return apiFetch<ApiOrder>(`/orders/${orderId}`);
}
