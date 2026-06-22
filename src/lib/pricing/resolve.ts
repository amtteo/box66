/** Zaokrúhlenie ceny na 2 desatinné miesta (EUR). */
export function roundPrice(value: number): number {
  return Math.round(value * 100) / 100;
}

export type MenuPriceInput = {
  basePrice: number | null;
  multiplier: number;
  customPrice: number | null;
};

/**
 * Efektívna cena položky menu: override centrálou, inak basePrice × koeficient predajne.
 */
export function resolveMenuItemPrice(input: MenuPriceInput): number | null {
  if (input.customPrice != null) return roundPrice(input.customPrice);
  if (input.basePrice == null) return null;
  return roundPrice(input.basePrice * input.multiplier);
}

export function toNumber(value: { toString(): string } | number | null | undefined): number | null {
  if (value == null) return null;
  return Number(value);
}
