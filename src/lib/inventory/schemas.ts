import * as z from "zod";

import { StockMovementType } from "@/generated/prisma/enums";

/** Typy pohybov dostupné v UI (manuálne). SALE_OUT generuje objednávka. */
export const MANUAL_MOVEMENT_TYPES = [
  StockMovementType.PURCHASE_IN,
  StockMovementType.ADJUSTMENT,
  StockMovementType.WASTE,
] as const;

export const MOVEMENT_LABEL: Record<string, string> = {
  [StockMovementType.PURCHASE_IN]: "Príjem (od dodávateľa)",
  [StockMovementType.ADJUSTMENT]: "Inventúrna korekcia",
  [StockMovementType.WASTE]: "Odpis / strata",
  [StockMovementType.SALE_OUT]: "Výdaj (predaj)",
  [StockMovementType.TRANSFER]: "Presun",
  [StockMovementType.RETURN]: "Vrátenie dodávateľovi",
};

const emptyToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

const positiveQuantity = z.preprocess(
  (v) => (v === "" || v == null ? undefined : v),
  z.coerce
    .number({ error: "Zadaj množstvo." })
    .gt(0, { error: "Množstvo musí byť kladné." })
    .max(9_999_999.999),
);

const optionalCost = z.preprocess(
  emptyToUndefined,
  z.coerce
    .number({ error: "Zadaj platnú sumu." })
    .min(0, { error: "Suma nemôže byť záporná." })
    .max(999999.9999)
    .optional(),
);

const optionalText = z.preprocess(
  emptyToUndefined,
  z.string().trim().max(300).optional(),
);

const optionalUuid = z.preprocess(
  (v) => (v === "" || v == null || v === "none" ? undefined : v),
  z.uuid().optional(),
);

export const StockMovementSchema = z.object({
  storeId: z.uuid(),
  ingredientId: z.uuid({ error: "Vyber surovinu." }),
  type: z.enum(MANUAL_MOVEMENT_TYPES, { error: "Vyber typ pohybu." }),
  quantity: positiveQuantity,
  /** Smer pri korekcii: prírastok (in) alebo úbytok (out). */
  direction: z.enum(["in", "out"]).default("in"),
  unitCost: optionalCost,
  supplierId: optionalUuid,
  reference: optionalText,
  note: optionalText,
});

export const ReorderLevelSchema = z.object({
  inventoryItemId: z.uuid(),
  reorderLevel: z.preprocess(
    emptyToUndefined,
    z.coerce.number().min(0, { error: "Hodnota nemôže byť záporná." }).optional(),
  ),
});

export type StockMovementInput = z.infer<typeof StockMovementSchema>;

export const ProductWasteSchema = z.object({
  storeId: z.uuid(),
  productId: z.uuid({ error: "Vyber produkt." }),
  quantity: positiveQuantity,
  reference: optionalText,
  note: optionalText,
});

export type ProductWasteInput = z.infer<typeof ProductWasteSchema>;
