"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { Role, requireProfile } from "@/lib/auth/dal";
import { authorizeStore } from "@/lib/auth/tenancy";
import { StockMovementType } from "@/generated/prisma/enums";
import {
  flattenZodError,
  rawValues,
  type FormState,
} from "@/lib/forms";
import { StockMovementSchema, ReorderLevelSchema, ProductWasteSchema } from "@/lib/inventory/schemas";
import { deductStockForProductWaste } from "@/lib/orders/stock";

const PATH = "/admin/sklad";

const round3 = (n: number) => Math.round(n * 1000) / 1000;

/** Zaeviduje pohyb skladu a transakčne aktualizuje stav (InventoryItem). */
export async function recordStockMovement(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = StockMovementSchema.safeParse({
    storeId: formData.get("storeId"),
    ingredientId: formData.get("ingredientId"),
    type: formData.get("type"),
    quantity: formData.get("quantity"),
    direction: formData.get("direction") ?? "in",
    unitCost: formData.get("unitCost"),
    supplierId: formData.get("supplierId"),
    reference: formData.get("reference"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    return { ok: false, errors: flattenZodError(parsed.error), values: rawValues(formData) };
  }

  const d = parsed.data;
  await authorizeStore(d.storeId, Role.MANAGER);
  const profile = await requireProfile();

  const ingredient = await prisma.ingredient.findUnique({
    where: { id: d.ingredientId },
    select: { unit: true, isActive: true },
  });
  if (!ingredient?.isActive) {
    return { ok: false, errors: { ingredientId: ["Neplatná surovina."] }, values: rawValues(formData) };
  }

  if (d.supplierId) {
    const link = await prisma.storeSupplier.findUnique({
      where: { storeId_supplierId: { storeId: d.storeId, supplierId: d.supplierId } },
      select: { isActive: true },
    });
    if (!link?.isActive) {
      return { ok: false, errors: { supplierId: ["Dodávateľ nie je schválený pre túto predajňu."] }, values: rawValues(formData) };
    }
  }

  // Znamienko pohybu podľa typu.
  let delta: number;
  if (d.type === StockMovementType.PURCHASE_IN) {
    delta = d.quantity;
  } else if (d.type === StockMovementType.WASTE) {
    delta = -d.quantity;
  } else {
    delta = d.direction === "out" ? -d.quantity : d.quantity;
  }

  try {
    await prisma.$transaction(async (tx) => {
      const current = await tx.inventoryItem.findUnique({
        where: { storeId_ingredientId: { storeId: d.storeId, ingredientId: d.ingredientId } },
        select: { quantity: true },
      });
      const newQty = round3((current ? Number(current.quantity) : 0) + delta);
      if (newQty < 0) {
        throw new Error("INSUFFICIENT_STOCK");
      }

      await tx.stockMovement.create({
        data: {
          storeId: d.storeId,
          ingredientId: d.ingredientId,
          type: d.type,
          quantity: delta,
          unit: ingredient.unit,
          unitCost: d.unitCost ?? null,
          reference: d.reference ?? null,
          note: d.note ?? null,
          supplierId: d.type === StockMovementType.PURCHASE_IN ? d.supplierId ?? null : null,
          createdById: profile.id,
        },
      });

      await tx.inventoryItem.upsert({
        where: { storeId_ingredientId: { storeId: d.storeId, ingredientId: d.ingredientId } },
        create: {
          storeId: d.storeId,
          ingredientId: d.ingredientId,
          quantity: newQty,
          unit: ingredient.unit,
          lastCountedAt: d.type === StockMovementType.ADJUSTMENT ? new Date() : null,
        },
        update: {
          quantity: newQty,
          ...(d.type === StockMovementType.ADJUSTMENT ? { lastCountedAt: new Date() } : {}),
        },
      });
    });
  } catch (err) {
    if (err instanceof Error && err.message === "INSUFFICIENT_STOCK") {
      return {
        ok: false,
        message: "Na sklade nie je dostatok zásob pre tento úbytok.",
        values: rawValues(formData),
      };
    }
    return { ok: false, message: "Pohyb skladu sa nepodarilo zaevidovať.", values: rawValues(formData) };
  }

  revalidatePath(PATH);
  return { ok: true };
}

/** Odpíše suroviny podľa receptúry produktu (viac pohybov WASTE naraz). */
export async function recordProductWaste(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = ProductWasteSchema.safeParse({
    storeId: formData.get("storeId"),
    productId: formData.get("productId"),
    quantity: formData.get("quantity"),
    reference: formData.get("reference"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    return { ok: false, errors: flattenZodError(parsed.error), values: rawValues(formData) };
  }

  const d = parsed.data;
  await authorizeStore(d.storeId, Role.MANAGER);
  const profile = await requireProfile();

  const menuItem = await prisma.menuItem.findUnique({
    where: { storeId_productId: { storeId: d.storeId, productId: d.productId } },
    select: {
      product: {
        select: {
          name: true,
          isActive: true,
          recipe: { select: { isActive: true, items: { select: { id: true }, take: 1 } } },
        },
      },
    },
  });
  const product = menuItem?.product;
  if (!product?.isActive || !product.recipe?.isActive || product.recipe.items.length === 0) {
    return {
      ok: false,
      errors: { productId: ["Produkt nemá aktívnu receptúru v menu predajne."] },
      values: rawValues(formData),
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await deductStockForProductWaste(tx, {
        storeId: d.storeId,
        productId: d.productId,
        productName: product.name,
        quantity: d.quantity,
        createdById: profile.id,
        note: d.note ?? null,
        reference: d.reference ?? null,
      });
    });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "INSUFFICIENT_STOCK") {
        return {
          ok: false,
          message: "Na sklade nie je dostatok zásob pre tento odpis.",
          values: rawValues(formData),
        };
      }
      if (err.message === "NO_RECIPE" || err.message === "UNIT_MISMATCH") {
        return {
          ok: false,
          message: "Receptúru produktu sa nepodarilo spracovať.",
          values: rawValues(formData),
        };
      }
    }
    return { ok: false, message: "Odpis podľa produktu sa nepodarilo zaevidovať.", values: rawValues(formData) };
  }

  revalidatePath(PATH);
  return { ok: true };
}

/** Nastaví hladinu doobjednania (reorder level) pre položku skladu. */
export async function setReorderLevel(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = ReorderLevelSchema.safeParse({
    inventoryItemId: formData.get("inventoryItemId"),
    reorderLevel: formData.get("reorderLevel"),
  });
  if (!parsed.success) {
    return { ok: false, errors: flattenZodError(parsed.error), values: rawValues(formData) };
  }

  const item = await prisma.inventoryItem.findUnique({
    where: { id: parsed.data.inventoryItemId },
    select: { storeId: true },
  });
  if (!item) return { ok: false, message: "Položka skladu neexistuje." };
  await authorizeStore(item.storeId, Role.MANAGER);

  try {
    await prisma.inventoryItem.update({
      where: { id: parsed.data.inventoryItemId },
      data: { reorderLevel: parsed.data.reorderLevel ?? null },
    });
  } catch {
    return { ok: false, message: "Hladinu sa nepodarilo uložiť." };
  }

  revalidatePath(PATH);
  return { ok: true };
}
