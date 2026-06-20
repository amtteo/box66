/** Rezerva na prípravu jedla a premávku naviac oproti času z trasy. */
export const DELIVERY_ESTIMATE_BUFFER_MINUTES = 30;

/** Čas trasy + rezerva pre zákaznícky odhad doručenia. */
export function estimatedDeliveryMinutes(routeMinutes: number): number {
  return routeMinutes + DELIVERY_ESTIMATE_BUFFER_MINUTES;
}

/** Zobrazí odhadovaný čas doručenia v slovenčine (trasa + rezerva). */
export function formatDeliveryDuration(routeMinutes: number): string {
  const minutes = estimatedDeliveryMinutes(routeMinutes);
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
}
