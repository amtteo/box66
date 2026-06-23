import "server-only";

import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@/generated/prisma/enums";
import { resolveMenuItemPrice, toNumber } from "@/lib/pricing/resolve";

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
  imageUrl: string | null;
};

/** Skupina výberu produktu s možnosťami dostupnými v danej predajni. */
export type MenuChoiceGroup = {
  id: string;
  label: string;
  minSelect: number;
  maxSelect: number;
  options: MenuChoiceOption[];
};

/** MENU upsell — dostupná MENU verzia single produktu v predajni. */
export type MenuUpsellItem = {
  id: string;
  name: string;
  imageUrl: string | null;
  price: number;
  choiceGroups: MenuChoiceGroup[];
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
    menuUpsellProductId: string | null;
    category: {
      id: string;
      name: string;
      sortOrder: number;
      imageUrl: string | null;
    };
  };
  choiceGroups: MenuChoiceGroup[];
  menuUpsell: MenuUpsellItem | null;
};

/** Dostupné položky menu predajne pre verejné objednávanie (zoradené podľa kategórie). */
export async function getPublicMenu(storeId: string): Promise<PublicMenuItem[]> {
  const [store, menuItems] = await Promise.all([
    prisma.store.findUnique({
      where: { id: storeId },
      select: { priceCoefficient: { select: { multiplier: true } } },
    }),
    prisma.menuItem.findMany({
      where: { storeId, isAvailable: true, product: { isActive: true, category: { showInStorefront: true } } },
      orderBy: [{ product: { category: { sortOrder: "asc" } } }, { sortOrder: "asc" }],
      select: {
        id: true,
        customPrice: true,
        product: {
          select: {
            id: true,
            name: true,
            description: true,
            imageUrl: true,
            allergens: true,
            kcal: true,
            prepMinutes: true,
            basePrice: true,
            menuUpsellProductId: true,
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
    }),
  ]);

  const multiplier = toNumber(store?.priceCoefficient.multiplier) ?? 1;

  const pricedItems = menuItems
    .map((mi) => {
      const price = resolveMenuItemPrice({
        basePrice: toNumber(mi.product.basePrice),
        multiplier,
        customPrice: toNumber(mi.customPrice),
      });
      if (price == null) return null;
      return { ...mi, price };
    })
    .filter((mi): mi is NonNullable<typeof mi> => mi != null);

  // Pool kategórie použité v skupinách výberu naprieč menu.
  const poolCategoryIds = new Set<string>();
  for (const mi of pricedItems) {
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
        product: { select: { id: true, name: true, categoryId: true, imageUrl: true } },
      },
    });
    for (const oi of optionItems) {
      const list = optionsByCategory.get(oi.product.categoryId) ?? [];
      list.push({
        menuItemId: oi.id,
        productId: oi.product.id,
        name: oi.product.name,
        imageUrl: oi.product.imageUrl,
      });
      optionsByCategory.set(oi.product.categoryId, list);
    }
  }

  return pricedItems.map((mi) => {
    const built = {
      id: mi.id,
      price: mi.price,
      product: {
        id: mi.product.id,
        name: mi.product.name,
        description: mi.product.description,
        imageUrl: mi.product.imageUrl,
        allergens: mi.product.allergens,
        kcal: mi.product.kcal,
        prepMinutes: mi.product.prepMinutes,
        menuUpsellProductId: mi.product.menuUpsellProductId,
        category: mi.product.category,
      },
      choiceGroups: mi.product.choiceGroups
        .map((g) => ({
          id: g.id,
          label: g.label,
          minSelect: g.minSelect,
          maxSelect: g.maxSelect,
          options: optionsByCategory.get(g.categoryId) ?? [],
        }))
        .filter((g) => g.options.length > 0),
      menuUpsell: null as MenuUpsellItem | null,
    };

    return built;
  }).map((mi, _idx, arr) => {
    const upsellProductId = mi.product.menuUpsellProductId;
    if (!upsellProductId) return mi;

    const upsellSource = arr.find((x) => x.product.id === upsellProductId);
    if (!upsellSource || upsellSource.choiceGroups.length === 0) return mi;

    return {
      ...mi,
      menuUpsell: {
        id: upsellSource.id,
        name: upsellSource.product.name,
        imageUrl: upsellSource.product.imageUrl,
        price: upsellSource.price,
        choiceGroups: upsellSource.choiceGroups,
      },
    };
  });
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
