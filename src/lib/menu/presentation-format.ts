import { formatMoney } from "@/lib/orders/types";

export const PRESENTATION_LOYALTY_LABEL = "Vernostná odmena";

/** Cena na prezentačnom menu; bez ceny = vernostná odmena (nie priamy predaj). */
export function formatPresentationPrice(
  price: number | null,
  currency: string,
): string {
  if (price == null) return PRESENTATION_LOYALTY_LABEL;
  return formatMoney(price, currency);
}
