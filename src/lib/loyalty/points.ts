import { LOYALTY_POINTS_PER_EURO } from "@/lib/loyalty/constants";

/** Body za subtotal objednávky (iba jedlo, bez donášky). Vždy floor. */
export function pointsFromSubtotal(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return Math.floor(subtotal * LOYALTY_POINTS_PER_EURO);
}

/** Proporcionálne body pri čiastočnom refunde. */
export function proportionalPoints(
  originalPoints: number,
  originalSubtotal: number,
  refundedSubtotal: number,
): number {
  if (originalPoints <= 0 || originalSubtotal <= 0 || refundedSubtotal <= 0) {
    return 0;
  }
  const ratio = Math.min(1, refundedSubtotal / originalSubtotal);
  return Math.floor(originalPoints * ratio);
}
