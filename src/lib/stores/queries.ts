import "server-only";

import { prisma } from "@/lib/prisma";

/** Predajne organizácie + počty (menu položky, sklad, objednávky). */
export async function getStoresForOrg(organizationId: string) {
  return prisma.store.findMany({
    where: { organizationId },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    include: {
      _count: {
        select: { menuItems: true, inventoryItems: true, orders: true, memberships: true },
      },
    },
  });
}

export type StoreRow = Awaited<ReturnType<typeof getStoresForOrg>>[number];
