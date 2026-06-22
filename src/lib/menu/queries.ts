import "server-only";

import { prisma } from "@/lib/prisma";
import { resolveMenuItemPrice, toNumber } from "@/lib/pricing/resolve";

/** Položky menu predajne + produkt a kategória. */
export async function getMenuItems(storeId: string) {
  const [items, store] = await Promise.all([
    prisma.menuItem.findMany({
      where: { storeId },
      orderBy: [
        { product: { category: { sortOrder: "asc" } } },
        { product: { category: { name: "asc" } } },
        { sortOrder: "asc" },
        { product: { name: "asc" } },
      ],
      include: {
        product: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            isActive: true,
            basePrice: true,
            category: { select: { id: true, name: true, sortOrder: true } },
          },
        },
      },
    }),
    prisma.store.findUnique({
      where: { id: storeId },
      select: { priceCoefficient: { select: { multiplier: true } } },
    }),
  ]);

  const multiplier = toNumber(store?.priceCoefficient.multiplier) ?? 1;

  return items.map((item) => ({
    ...item,
    effectivePrice: resolveMenuItemPrice({
      basePrice: toNumber(item.product.basePrice),
      multiplier,
      customPrice: toNumber(item.customPrice),
    }),
  }));
}

/** Aktívne globálne produkty, ktoré ešte nie sú v menu danej predajne. */
export async function getProductsNotInMenu(storeId: string) {
  const existing = await prisma.menuItem.findMany({
    where: { storeId },
    select: { productId: true },
  });
  const excludeIds = existing.map((m) => m.productId);

  return prisma.product.findMany({
    where: { isActive: true, id: { notIn: excludeIds } },
    orderBy: [
      { category: { sortOrder: "asc" } },
      { category: { name: "asc" } },
      { sortOrder: "asc" },
      { name: "asc" },
    ],
    select: {
      id: true,
      name: true,
      category: { select: { name: true } },
    },
  });
}

export type MenuItemRow = Awaited<ReturnType<typeof getMenuItems>>[number];
export type ProductOption = Awaited<
  ReturnType<typeof getProductsNotInMenu>
>[number];
