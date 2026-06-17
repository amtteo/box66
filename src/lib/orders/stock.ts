import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";
import { StockMovementType, UnitOfMeasure } from "@/generated/prisma/enums";
import { convertQuantity, round3 } from "@/lib/inventory/units";

/** Interaktívny transakčný klient Prisma (`prisma.$transaction(async (tx) => …)`). */
export type TxClient = Parameters<
  Parameters<PrismaClient["$transaction"]>[0]
>[0];

export type OrderLine = { productId: string | null; quantity: number };

/** Spotreba surovín objednávky: ingredientId → { quantity, unit }. */
export type Consumption = Map<string, { quantity: number; unit: UnitOfMeasure }>;

/**
 * Spočíta spotrebu surovín pre položky objednávky cez globálne receptúry.
 * Položky bez receptúry (napr. balené nápoje) sklad neodpočítavajú.
 * Množstvo z receptúry sa škáluje výťažnosťou (`yield`) a prevedie do jednotky
 * skladu danej suroviny. Pri nekompatibilných jednotkách vyhodí `UNIT_MISMATCH`.
 */
export async function computeConsumption(
  tx: TxClient,
  lines: OrderLine[],
): Promise<Consumption> {
  const qtyByProduct = new Map<string, number>();
  for (const line of lines) {
    if (!line.productId) continue;
    qtyByProduct.set(
      line.productId,
      (qtyByProduct.get(line.productId) ?? 0) + line.quantity,
    );
  }
  if (qtyByProduct.size === 0) return new Map();

  const recipes = await tx.recipe.findMany({
    where: { productId: { in: [...qtyByProduct.keys()] }, isActive: true },
    select: {
      productId: true,
      yield: true,
      items: {
        select: {
          quantity: true,
          unit: true,
          ingredient: { select: { id: true, unit: true } },
        },
      },
    },
  });

  const consumption: Consumption = new Map();
  for (const recipe of recipes) {
    const orderedQty = qtyByProduct.get(recipe.productId) ?? 0;
    const batches = orderedQty / Math.max(recipe.yield, 1);
    for (const item of recipe.items) {
      const ingredientUnit = item.ingredient.unit;
      const perBatch = convertQuantity(
        Number(item.quantity),
        item.unit,
        ingredientUnit,
      );
      const needed = perBatch * batches;
      const existing = consumption.get(item.ingredient.id);
      consumption.set(item.ingredient.id, {
        quantity: round3((existing?.quantity ?? 0) + needed),
        unit: ingredientUnit,
      });
    }
  }
  return consumption;
}

/** Zapíše pohyby skladu a aktualizuje stavy podľa vypočítanej spotreby. */
export async function applyStockConsumption(
  tx: TxClient,
  params: {
    storeId: string;
    consumption: Consumption;
    type: StockMovementType;
    /** Záporné = úbytok, kladné = prírastok. */
    quantitySign: -1 | 1;
    createdById?: string | null;
    orderId?: string | null;
    note?: string | null;
    reference?: string | null;
  },
): Promise<void> {
  for (const [ingredientId, { quantity, unit }] of params.consumption) {
    if (quantity <= 0) continue;

    const delta = round3(params.quantitySign * quantity);

    const current = await tx.inventoryItem.findUnique({
      where: {
        storeId_ingredientId: { storeId: params.storeId, ingredientId },
      },
      select: { quantity: true, unit: true },
    });
    const currentQty = current ? Number(current.quantity) : 0;
    const newQty = round3(currentQty + delta);
    if (newQty < 0) {
      throw new Error("INSUFFICIENT_STOCK");
    }

    await tx.stockMovement.create({
      data: {
        storeId: params.storeId,
        ingredientId,
        type: params.type,
        quantity: delta,
        unit: current?.unit ?? unit,
        orderId: params.orderId ?? null,
        createdById: params.createdById ?? null,
        note: params.note ?? null,
        reference: params.reference ?? null,
      },
    });

    await tx.inventoryItem.upsert({
      where: {
        storeId_ingredientId: { storeId: params.storeId, ingredientId },
      },
      create: {
        storeId: params.storeId,
        ingredientId,
        quantity: newQty,
        unit: current?.unit ?? unit,
      },
      update: { quantity: newQty },
    });
  }
}

/**
 * Transakčne odpočíta sklad podľa receptúr objednávky (pohyby `SALE_OUT`).
 * Pri nedostatku zásob vyhodí `INSUFFICIENT_STOCK`. Volá sa pri potvrdení.
 */
export async function deductStockForOrder(
  tx: TxClient,
  params: {
    storeId: string;
    orderId: string;
    lines: OrderLine[];
    createdById?: string | null;
  },
): Promise<void> {
  const consumption = await computeConsumption(tx, params.lines);
  await applyStockConsumption(tx, {
    storeId: params.storeId,
    consumption,
    type: StockMovementType.SALE_OUT,
    quantitySign: -1,
    orderId: params.orderId,
    createdById: params.createdById,
    note: "Automatický odpočet predajom",
  });
}

/**
 * Odpíše suroviny podľa receptúry produktu (pohyby `WASTE`).
 * Pri nedostatku zásob vyhodí `INSUFFICIENT_STOCK`, bez receptúry `NO_RECIPE`.
 */
export async function deductStockForProductWaste(
  tx: TxClient,
  params: {
    storeId: string;
    productId: string;
    productName: string;
    quantity: number;
    createdById?: string | null;
    note?: string | null;
    reference?: string | null;
  },
): Promise<void> {
  const consumption = await computeConsumption(tx, [
    { productId: params.productId, quantity: params.quantity },
  ]);
  if (consumption.size === 0) {
    throw new Error("NO_RECIPE");
  }

  const auditNote = [
    `Odpis podľa produktu: ${params.quantity}× ${params.productName}`,
    params.note,
  ]
    .filter(Boolean)
    .join(" — ");

  await applyStockConsumption(tx, {
    storeId: params.storeId,
    consumption,
    type: StockMovementType.WASTE,
    quantitySign: -1,
    createdById: params.createdById,
    note: auditNote,
    reference: params.reference,
  });
}

/**
 * Vráti sklad späť po zrušení/refundácii objednávky, ktorá už mala odpočet.
 * Pre každý pôvodný `SALE_OUT` zapíše opačný (kladný) pohyb a navýši stav.
 */
export async function reverseStockForOrder(
  tx: TxClient,
  params: { storeId: string; orderId: string; createdById?: string | null },
): Promise<void> {
  const movements = await tx.stockMovement.findMany({
    where: {
      orderId: params.orderId,
      type: StockMovementType.SALE_OUT,
      quantity: { lt: 0 },
    },
    select: { ingredientId: true, quantity: true, unit: true },
  });
  if (movements.length === 0) return;

  const restore = new Map<string, { quantity: number; unit: UnitOfMeasure }>();
  for (const m of movements) {
    const add = Math.abs(Number(m.quantity));
    const existing = restore.get(m.ingredientId);
    restore.set(m.ingredientId, {
      quantity: round3((existing?.quantity ?? 0) + add),
      unit: m.unit,
    });
  }

  for (const [ingredientId, { quantity, unit }] of restore) {
    const current = await tx.inventoryItem.findUnique({
      where: {
        storeId_ingredientId: { storeId: params.storeId, ingredientId },
      },
      select: { quantity: true, unit: true },
    });
    const newQty = round3((current ? Number(current.quantity) : 0) + quantity);

    await tx.stockMovement.create({
      data: {
        storeId: params.storeId,
        ingredientId,
        type: StockMovementType.ADJUSTMENT,
        quantity: round3(quantity),
        unit: current?.unit ?? unit,
        orderId: params.orderId,
        createdById: params.createdById ?? null,
        note: "Vrátenie na sklad po zrušení objednávky",
      },
    });

    await tx.inventoryItem.upsert({
      where: {
        storeId_ingredientId: { storeId: params.storeId, ingredientId },
      },
      create: {
        storeId: params.storeId,
        ingredientId,
        quantity: newQty,
        unit: current?.unit ?? unit,
      },
      update: { quantity: newQty },
    });
  }
}
