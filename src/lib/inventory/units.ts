import { UnitOfMeasure } from "@/generated/prisma/enums";

export const round3 = (n: number) => Math.round(n * 1000) / 1000;

/** Prevodové faktory do základnej jednotky skupiny (hmotnosť → g, objem → ml). */
const MASS: Partial<Record<UnitOfMeasure, number>> = {
  [UnitOfMeasure.G]: 1,
  [UnitOfMeasure.KG]: 1000,
};
const VOLUME: Partial<Record<UnitOfMeasure, number>> = {
  [UnitOfMeasure.ML]: 1,
  [UnitOfMeasure.L]: 1000,
};

/** Prevedie množstvo z jednej mernej jednotky na druhú (v rámci skupiny). */
export function convertQuantity(
  qty: number,
  from: UnitOfMeasure,
  to: UnitOfMeasure,
): number {
  if (from === to) return qty;
  const group = MASS[from] != null ? MASS : VOLUME[from] != null ? VOLUME : null;
  if (!group || group[to] == null) {
    throw new Error("UNIT_MISMATCH");
  }
  return (qty * (group[from] as number)) / (group[to] as number);
}
