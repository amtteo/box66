import type { ApiMenuResponse } from "@/lib/orders/api-types";
import type { PublicMenuItem } from "@/lib/orders/queries";

/** Mapuje verejné menu z Order API na tvar používaný storefrontom. */
export function mapApiMenuToPublicMenu(menu: ApiMenuResponse): PublicMenuItem[] {
  return menu.items
    .filter((item) => item.isAvailable)
    .map((item) => ({
      id: item.id,
      price: Number.parseFloat(item.price),
      product: {
        id: item.productId,
        name: item.name,
        description: item.description ?? null,
        imageUrl: item.imageUrl ?? null,
        allergens: [],
        kcal: null,
        prepMinutes: null,
        menuUpsellProductId: null,
        category: {
          id: item.categoryId,
          name: item.categoryName,
          sortOrder: item.sortOrder,
          imageUrl: null,
        },
      },
      choiceGroups: (item.choiceGroups ?? [])
        .map((g) => ({
          id: g.id,
          label: g.label,
          minSelect: g.minSelect,
          maxSelect: g.maxSelect,
          options: g.options
            .filter((o) => o.isAvailable && o.menuItemId)
            .map((o) => ({
              menuItemId: o.menuItemId!,
              productId: o.productId,
              name: o.name,
              imageUrl: null,
            })),
        }))
        .filter((g) => g.options.length > 0),
      menuUpsell: null,
    }))
    .filter((item) => Number.isFinite(item.price) && item.price > 0);
}
