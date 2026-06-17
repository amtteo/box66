import "server-only";

import { prisma } from "@/lib/prisma";
import { convertQuantity, round3 } from "@/lib/inventory/units";
import type { UnitOfMeasure } from "@/generated/prisma/enums";

/** Aktuálne stavy skladu predajne + surovina. */
export async function getInventory(storeId: string) {
  return prisma.inventoryItem.findMany({
    where: { storeId },
    orderBy: [{ ingredient: { name: "asc" } }],
    include: {
      ingredient: { select: { id: true, name: true } },
    },
  });
}

/** Posledné pohyby skladu predajne (kniha). */
export async function getStockMovements(storeId: string, take = 50) {
  return prisma.stockMovement.findMany({
    where: { storeId },
    orderBy: [{ createdAt: "desc" }],
    take,
    include: {
      ingredient: { select: { name: true } },
      supplier: { select: { name: true } },
      createdBy: { select: { fullName: true, email: true } },
    },
  });
}

export type InventoryRow = Awaited<ReturnType<typeof getInventory>>[number];
export type StockMovementRow = Awaited<
  ReturnType<typeof getStockMovements>
>[number];

export type ProductWasteOption = {
  productId: string;
  name: string;
  ingredients: {
    ingredientId: string;
    name: string;
    quantityPerPortion: number;
    unit: UnitOfMeasure;
  }[];
};

/** Produkty v menu predajne s aktívnou receptúrou — pre odpis podľa produktu. */
export async function getMenuProductsForWaste(
  storeId: string,
): Promise<ProductWasteOption[]> {
  const menuItems = await prisma.menuItem.findMany({
    where: {
      storeId,
      product: {
        isActive: true,
        recipe: { isActive: true, items: { some: {} } },
      },
    },
    orderBy: [{ product: { name: "asc" } }],
    select: {
      product: {
        select: {
          id: true,
          name: true,
          recipe: {
            select: {
              yield: true,
              items: {
                orderBy: [{ ingredient: { name: "asc" } }],
                select: {
                  quantity: true,
                  unit: true,
                  ingredient: { select: { id: true, name: true, unit: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  return menuItems.map((mi) => {
    const recipe = mi.product.recipe!;
    const yieldVal = Math.max(recipe.yield, 1);
    return {
      productId: mi.product.id,
      name: mi.product.name,
      ingredients: recipe.items.map((item) => ({
        ingredientId: item.ingredient.id,
        name: item.ingredient.name,
        quantityPerPortion: round3(
          convertQuantity(
            Number(item.quantity),
            item.unit,
            item.ingredient.unit,
          ) / yieldVal,
        ),
        unit: item.ingredient.unit,
      })),
    };
  });
}
