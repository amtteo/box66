import "server-only";

import { prisma } from "@/lib/prisma";

/** Skupiny výberu (kombo) definované na danom produkte + názov pool kategórie. */
export async function getChoiceGroupsForProduct(productId: string) {
  return prisma.productChoiceGroup.findMany({
    where: { productId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      label: true,
      minSelect: true,
      maxSelect: true,
      sortOrder: true,
      category: {
        select: {
          id: true,
          name: true,
          _count: {
            select: { products: { where: { isComboOption: true, isActive: true } } },
          },
        },
      },
    },
  });
}

export type ChoiceGroupRow = Awaited<
  ReturnType<typeof getChoiceGroupsForProduct>
>[number];
