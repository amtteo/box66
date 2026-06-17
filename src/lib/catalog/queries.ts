import "server-only";

import { prisma } from "@/lib/prisma";

/** Všetky kategórie + počet produktov, zoradené podľa poradia a názvu. */
export async function getCategories() {
  return prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });
}

/** Kategórie pre výber vo formulároch (len aktívne nie sú filtrované — superadmin vidí všetko). */
export async function getCategoryOptions() {
  return prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, isActive: true, isChoicePool: true },
  });
}

/** Kategórie označené ako „pool" výberu (napr. Nápoje k menu) — pre kombo skupiny. */
export async function getChoicePoolCategories() {
  return prisma.category.findMany({
    where: { isChoicePool: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });
}

/** Všetky produkty + kategória a receptúra, zoradené podľa poradia a názvu. */
export async function getProducts() {
  return prisma.product.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      category: { select: { id: true, name: true } },
      recipe: {
        select: {
          id: true,
          isActive: true,
          yield: true,
          _count: { select: { items: true } },
        },
      },
    },
  });
}

/** Jeden produkt + kategória (pre detail / správu výberov). */
export async function getProductById(id: string) {
  return prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      isActive: true,
      isComboOption: true,
      category: { select: { id: true, name: true } },
    },
  });
}

/** Globálne ingrediencie. */
export async function getGlobalIngredients() {
  return prisma.ingredient.findMany({
    orderBy: [{ name: "asc" }],
  });
}

/** Aktívne globálne ingrediencie pre selektory (sklad, receptúry, cenníky). */
export async function getActiveIngredients() {
  return prisma.ingredient.findMany({
    where: { isActive: true },
    orderBy: [{ name: "asc" }],
    select: { id: true, name: true, unit: true },
  });
}

export type IngredientOption = Awaited<ReturnType<typeof getActiveIngredients>>[number];
export type CategoryRow = Awaited<ReturnType<typeof getCategories>>[number];
export type ProductRow = Awaited<ReturnType<typeof getProducts>>[number];
export type IngredientRow = Awaited<
  ReturnType<typeof getGlobalIngredients>
>[number];
export type CategoryOption = Awaited<
  ReturnType<typeof getCategoryOptions>
>[number];
