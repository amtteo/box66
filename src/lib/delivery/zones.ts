/** Doručovacia zóna (km rozsah → cena). */
export type DeliveryZoneRow = {
  id: string;
  minKm: number;
  maxKm: number;
  price: number;
  sortOrder: number;
};

export function sortDeliveryZones<T extends Pick<DeliveryZoneRow, "sortOrder" | "minKm">>(
  zones: T[],
): T[] {
  return [...zones].sort((a, b) => a.sortOrder - b.sortOrder || a.minKm - b.minKm);
}

/**
 * Nájde cenu donášky pre vzdialenosť v km. Zóna platí pre minKm ≤ vzdialenosť ≤ maxKm.
 * Vráti null, ak adresa je mimo všetkých zón.
 */
export function resolveDeliveryFee(
  distanceKm: number,
  zones: DeliveryZoneRow[],
): number | null {
  const sorted = sortDeliveryZones(zones);
  for (const zone of sorted) {
    if (distanceKm >= zone.minKm && distanceKm <= zone.maxKm) {
      return zone.price;
    }
  }
  return null;
}

export const FALLBACK_DEFAULT_ZONES: Omit<DeliveryZoneRow, "id">[] = [
  { minKm: 0, maxKm: 6, price: 1.99, sortOrder: 0 },
];
