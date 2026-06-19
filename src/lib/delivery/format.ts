/** Zobrazí odhadovaný čas doručenia v slovenčine. */
export function formatDeliveryDuration(minutes: number): string {
  if (minutes < 60) return `cca ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `cca ${hours} h`;
  return `cca ${hours} h ${mins} min`;
}
