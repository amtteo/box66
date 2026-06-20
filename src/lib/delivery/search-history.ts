const SEARCH_HISTORY_KEY = "box66_delivery_search_history";
const MAX_SEARCH_HISTORY = 3;

/** Adresy z Google výberu — localStorage v prehliadači (hostia aj prihlásení). */
export type DeliverySearchHistoryEntry = {
  address: string;
  lat: number;
  lng: number;
};

function readRaw(): DeliverySearchHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SEARCH_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is DeliverySearchHistoryEntry =>
        typeof e === "object" &&
        e != null &&
        typeof (e as DeliverySearchHistoryEntry).address === "string" &&
        typeof (e as DeliverySearchHistoryEntry).lat === "number" &&
        typeof (e as DeliverySearchHistoryEntry).lng === "number",
    );
  } catch {
    return [];
  }
}

function writeRaw(entries: DeliverySearchHistoryEntry[]) {
  try {
    window.localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(entries));
  } catch {
    /* ignore */
  }
}

/** Posledné vyhľadávané adresy (max 3), najnovšie prvé. */
export function getDeliverySearchHistory(): DeliverySearchHistoryEntry[] {
  return readRaw().slice(0, MAX_SEARCH_HISTORY);
}

/** Uloží adresu z Google výberu do histórie vyhľadávania. */
export function pushDeliverySearchHistory(entry: DeliverySearchHistoryEntry) {
  const normalized = entry.address.trim();
  if (!normalized) return;

  const next = [
    entry,
    ...readRaw().filter(
      (e) => e.address.trim().toLowerCase() !== normalized.toLowerCase(),
    ),
  ].slice(0, MAX_SEARCH_HISTORY);

  writeRaw(next);
}

export function clearDeliverySearchHistory() {
  try {
    window.localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch {
    /* ignore */
  }
}
