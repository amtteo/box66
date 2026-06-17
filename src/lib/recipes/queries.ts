import "server-only";

import { prisma } from "@/lib/prisma";

/** Jedna receptúra + položky a suroviny (na detail). */
export async function getRecipeById(id: string) {
  return prisma.recipe.findUnique({
    where: { id },
    include: {
      product: { select: { id: true, name: true } },
      items: {
        orderBy: [{ ingredient: { name: "asc" } }],
        include: { ingredient: { select: { id: true, name: true, unit: true } } },
      },
    },
  });
}

/** Receptúra produktu + položky a suroviny (na detail podľa produktu). */
export async function getRecipeByProductId(productId: string) {
  return prisma.recipe.findUnique({
    where: { productId },
    include: {
      product: { select: { id: true, name: true } },
      items: {
        orderBy: [{ ingredient: { name: "asc" } }],
        include: { ingredient: { select: { id: true, name: true, unit: true } } },
      },
    },
  });
}

export type RecipeDetail = NonNullable<Awaited<ReturnType<typeof getRecipeById>>>;
