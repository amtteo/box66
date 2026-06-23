import { formatMoney } from "@/lib/orders/types";

/** Cena na prezentačnom menu; bez ceny = vernostná odmena (nie priamy predaj). */
export function formatPresentationPrice(
  price: number | null,
  currency: string,
): string {
  if (price == null) return "Vernostná odmena";
  return formatMoney(price, currency);
}
