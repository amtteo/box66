import { haversineKm } from "@/lib/delivery/haversine";
import type { PublicStoreOption } from "@/lib/delivery/queries";

export type RankedStore = PublicStoreOption & {
  /** Vzdialenosť vzdušnou čiarou v km (null ak predajňa nemá súradnice). */
  airDistanceKm: number | null;
};

/** Zoradí predajne podľa vzdušnej vzdialenosti a vráti top N. */
export function rankStoresByProximity(
  stores: PublicStoreOption[],
  lat: number,
  lng: number,
  limit = 3,
): RankedStore[] {
  const ranked = stores
    .map((store) => {
      const airDistanceKm =
        store.latitude != null && store.longitude != null
          ? haversineKm(lat, lng, store.latitude, store.longitude)
          : null;
      return { ...store, airDistanceKm };
    })
    .sort((a, b) => {
      const da = a.airDistanceKm ?? Number.POSITIVE_INFINITY;
      const db = b.airDistanceKm ?? Number.POSITIVE_INFINITY;
      return da - db;
    });

  return ranked.slice(0, limit);
}
