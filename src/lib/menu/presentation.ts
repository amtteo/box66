import "server-only";

import { prisma } from "@/lib/prisma";
import { resolveMenuItemPrice, toNumber } from "@/lib/pricing/resolve";

/** Ingrediencia v zložení produktu (názov + voliteľný obrázok). */
export type PresentationIngredient = {
  name: string;
  imageUrl: string | null;
};

/** Položka menu pre verejnú prezentáciu (McDonald's-style, bez košíka). */
export type PresentationItem = {
  productId: string;
  menuItemId: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  allergens: string[];
  kcal: number | null;
  prepMinutes: number | null;
  price: number;
  /** Zloženie z globálnej receptúry (bez množstiev). */
  ingredients: PresentationIngredient[];
};

export type PresentationCategory = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  items: PresentationItem[];
};

/** Spoločný výber produktu pre prezentáciu (kategória + receptúra). */
const productSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  imageUrl: true,
  allergens: true,
  kcal: true,
  prepMinutes: true,
  category: {
    select: {
      id: true,
      name: true,
      description: true,
      imageUrl: true,
      sortOrder: true,
    },
  },
  recipe: {
    select: {
      isActive: true,
      items: {
        orderBy: { ingredient: { name: "asc" } },
        select: { ingredient: { select: { name: true, imageUrl: true } } },
      },
    },
  },
} as const;

type MenuItemWithProduct = {
  id: string;
  customPrice: { toString(): string } | number | null;
  product: {
    basePrice: { toString(): string } | number | null;
    id: string;
    name: string;
    slug: string;
    description: string | null;
    imageUrl: string | null;
    allergens: string[];
    kcal: number | null;
    prepMinutes: number | null;
    category: {
      id: string;
      name: string;
      description: string | null;
      imageUrl: string | null;
    };
    recipe: { isActive: boolean; items: { ingredient: { name: string; imageUrl: string | null } }[] } | null;
  };
};

function toItem(mi: MenuItemWithProduct, multiplier: number): PresentationItem | null {
  const p = mi.product;
  const price = resolveMenuItemPrice({
    basePrice: toNumber(p.basePrice),
    multiplier,
    customPrice: toNumber(mi.customPrice),
  });
  if (price == null) return null;
  return {
    productId: p.id,
    menuItemId: mi.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    imageUrl: p.imageUrl,
    allergens: p.allergens,
    kcal: p.kcal,
    prepMinutes: p.prepMinutes,
    price,
    ingredients:
      p.recipe?.isActive === true
        ? p.recipe.items.map((it) => ({
            name: it.ingredient.name,
            imageUrl: it.ingredient.imageUrl,
          }))
        : [],
  };
}

/**
 * Verejné menu predajne zoskupené podľa kategórií (pre prezentačnú stránku).
 * Cena sa počíta z `Product.basePrice` × koeficient predajne (alebo override).
 */
export async function getPresentationMenu(
  storeId: string,
): Promise<PresentationCategory[]> {
  const [store, items] = await Promise.all([
    prisma.store.findUnique({
      where: { id: storeId },
      select: { priceCoefficient: { select: { multiplier: true } } },
    }),
    prisma.menuItem.findMany({
      where: { storeId, isAvailable: true, product: { isActive: true } },
      orderBy: [
        { product: { category: { sortOrder: "asc" } } },
        { sortOrder: "asc" },
        { product: { name: "asc" } },
      ],
      select: {
        id: true,
        customPrice: true,
        product: {
          select: {
            ...productSelect,
            basePrice: true,
          },
        },
      },
    }),
  ]);

  const multiplier = toNumber(store?.priceCoefficient.multiplier) ?? 1;

  const map = new Map<string, PresentationCategory>();
  for (const mi of items) {
    const item = toItem(mi as MenuItemWithProduct, multiplier);
    if (!item) continue;
    const cat = mi.product.category;
    if (!map.has(cat.id)) {
      map.set(cat.id, {
        id: cat.id,
        name: cat.name,
        description: cat.description,
        imageUrl: cat.imageUrl,
        items: [],
      });
    }
    map.get(cat.id)!.items.push(item);
  }
  return [...map.values()];
}

export type PresentationProduct = PresentationItem & {
  categoryId: string;
  categoryName: string;
  related: PresentationItem[];
};

/** Detail jedného produktu pre prezentáciu + súvisiace položky z rovnakej kategórie. */
export async function getPresentationProduct(
  storeId: string,
  slug: string,
): Promise<PresentationProduct | null> {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { priceCoefficient: { select: { multiplier: true } } },
  });
  const multiplier = toNumber(store?.priceCoefficient.multiplier) ?? 1;

  const mi = await prisma.menuItem.findFirst({
    where: {
      storeId,
      isAvailable: true,
      product: { slug, isActive: true },
    },
    select: {
      id: true,
      customPrice: true,
      product: { select: { ...productSelect, basePrice: true } },
    },
  });
  if (!mi) return null;

  const item = toItem(mi as MenuItemWithProduct, multiplier);
  if (!item) return null;
  const categoryId = mi.product.category.id;

  const siblings = await prisma.menuItem.findMany({
    where: {
      storeId,
      isAvailable: true,
      product: { isActive: true, categoryId, slug: { not: slug } },
    },
    orderBy: [{ sortOrder: "asc" }, { product: { name: "asc" } }],
    take: 3,
    select: {
      id: true,
      customPrice: true,
      product: { select: { ...productSelect, basePrice: true } },
    },
  });

  return {
    ...item,
    categoryId,
    categoryName: mi.product.category.name,
    related: siblings
      .map((s) => toItem(s as MenuItemWithProduct, multiplier))
      .filter((s): s is PresentationItem => s != null),
  };
}

/** Kontaktné údaje predvolenej predajne pre footer / stránku Kontakt. */
export async function getStoreContact() {
  return prisma.store.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      street: true,
      city: true,
      postalCode: true,
      country: true,
      phone: true,
      email: true,
      currency: true,
      openingHours: true,
    },
  });
}

export type StoreContact = NonNullable<
  Awaited<ReturnType<typeof getStoreContact>>
>;
