import "server-only";

import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@/generated/prisma/enums";

/**
 * Predvolená verejná predajňa pre úvodnú stránku. Zatiaľ máme jednu prevádzku,
 * preto berieme prvú aktívnu; kód je však store-aware a pripravený na výber
 * z viacerých predajní (stačí pridať prepínač a posielať storeId).
 */
export async function getDefaultStore() {
  return prisma.store.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, slug: true, currency: true, city: true },
  });
}

/** Možnosť výberu (kombo) dostupná v predajni. */
export type MenuChoiceOption = {
  menuItemId: string;
  productId: string;
  name: string;
};

/** Skupina výberu produktu s možnosťami dostupnými v danej predajni. */
export type MenuChoiceGroup = {
  id: string;
  label: string;
  minSelect: number;
  maxSelect: number;
  options: MenuChoiceOption[];
};

export type PublicMenuItem = {
  id: string;
  price: number;
  product: {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    allergens: string[];
    kcal: number | null;
    prepMinutes: number | null;
    category: {
      id: string;
      name: string;
      sortOrder: number;
      imageUrl: string | null;
    };
  };
  choiceGroups: MenuChoiceGroup[];
};

/** Dostupné položky menu predajne pre verejné objednávanie (zoradené podľa kategórie). */
export async function getPublicMenu(storeId: string): Promise<PublicMenuItem[]> {
  const menuItems = await prisma.menuItem.findMany({
    where: { storeId, isAvailable: true, product: { isActive: true } },
    orderBy: [{ product: { category: { sortOrder: "asc" } } }, { sortOrder: "asc" }],
    select: {
      id: true,
      price: true,
      product: {
        select: {
          id: true,
          name: true,
          description: true,
          imageUrl: true,
          allergens: true,
          kcal: true,
          prepMinutes: true,
          category: {
            select: { id: true, name: true, sortOrder: true, imageUrl: true },
          },
          choiceGroups: {
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
            select: {
              id: true,
              label: true,
              minSelect: true,
              maxSelect: true,
              categoryId: true,
            },
          },
        },
      },
    },
  });

  // Pool kategórie použité v skupinách výberu naprieč menu.
  const poolCategoryIds = new Set<string>();
  for (const mi of menuItems) {
    for (const g of mi.product.choiceGroups) poolCategoryIds.add(g.categoryId);
  }

  // Možnosti = produkty z poolov, ktoré sú v menu predajne a označené ako kombo-voľba.
  const optionsByCategory = new Map<string, MenuChoiceOption[]>();
  if (poolCategoryIds.size > 0) {
    const optionItems = await prisma.menuItem.findMany({
      where: {
        storeId,
        isAvailable: true,
        product: {
          isActive: true,
          isComboOption: true,
          categoryId: { in: [...poolCategoryIds] },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { product: { name: "asc" } }],
      select: {
        id: true,
        product: { select: { id: true, name: true, categoryId: true } },
      },
    });
    for (const oi of optionItems) {
      const list = optionsByCategory.get(oi.product.categoryId) ?? [];
      list.push({
        menuItemId: oi.id,
        productId: oi.product.id,
        name: oi.product.name,
      });
      optionsByCategory.set(oi.product.categoryId, list);
    }
  }

  return menuItems.map((mi) => ({
    id: mi.id,
    price: Number(mi.price),
    product: {
      id: mi.product.id,
      name: mi.product.name,
      description: mi.product.description,
      imageUrl: mi.product.imageUrl,
      allergens: mi.product.allergens,
      kcal: mi.product.kcal,
      prepMinutes: mi.product.prepMinutes,
      category: mi.product.category,
    },
    // Ponúkni len skupiny, ktoré majú v tejto predajni aspoň jednu možnosť.
    choiceGroups: mi.product.choiceGroups
      .map((g) => ({
        id: g.id,
        label: g.label,
        minSelect: g.minSelect,
        maxSelect: g.maxSelect,
        options: optionsByCategory.get(g.categoryId) ?? [],
      }))
      .filter((g) => g.options.length > 0),
  }));
}

/** Zoznam objednávok predajne pre admin (najnovšie hore). */
export async function getStoreOrders(storeId: string, take = 100) {
  return prisma.order.findMany({
    where: { storeId },
    orderBy: { placedAt: "desc" },
    take,
    select: {
      id: true,
      orderNumber: true,
      type: true,
      status: true,
      paymentStatus: true,
      paymentMethod: true,
      total: true,
      currency: true,
      customerName: true,
      customerEmail: true,
      customerPhone: true,
      note: true,
      placedAt: true,
      customer: { select: { fullName: true, email: true } },
      items: {
        orderBy: { nameSnapshot: "asc" },
        select: {
          id: true,
          nameSnapshot: true,
          quantity: true,
          unitPrice: true,
          lineTotal: true,
          note: true,
          choices: {
            orderBy: { groupLabel: "asc" },
            select: { id: true, groupLabel: true, nameSnapshot: true },
          },
        },
      },
    },
  });
}

/** Počet otvorených objednávok (na badge / dashboard). */
export async function getOpenOrdersCount(storeId: string) {
  return prisma.order.count({
    where: {
      storeId,
      status: {
        in: [
          OrderStatus.PENDING,
          OrderStatus.CONFIRMED,
          OrderStatus.PREPARING,
          OrderStatus.READY,
        ],
      },
    },
  });
}

export type StoreOrderRow = Awaited<ReturnType<typeof getStoreOrders>>[number];
