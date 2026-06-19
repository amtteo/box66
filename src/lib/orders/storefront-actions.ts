"use server";

import { getPublicMenu } from "@/lib/orders/queries";
import { buildMenuCategories } from "@/lib/orders/menu-dto";
import type { MenuCategoryDTO } from "@/lib/orders/types";

/** Načíta menu predajne pre klientsky prepínač predajní na úvodnej stránke. */
export async function fetchStoreMenu(
  storeId: string,
): Promise<{ categories: MenuCategoryDTO[]; currency: string } | null> {
  const { prisma } = await import("@/lib/prisma");
  const store = await prisma.store.findFirst({
    where: { id: storeId, isActive: true },
    select: { id: true, currency: true },
  });
  if (!store) return null;

  const menu = await getPublicMenu(store.id);
  return {
    categories: buildMenuCategories(menu),
    currency: store.currency,
  };
}
