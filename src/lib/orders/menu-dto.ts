import type { MenuCategoryDTO } from "@/lib/orders/types";
import type { PublicMenuItem } from "@/lib/orders/queries";

/** Zoskupí položky menu do kategórií pre storefront. */
export function buildMenuCategories(menu: PublicMenuItem[]): MenuCategoryDTO[] {
  const map = new Map<string, MenuCategoryDTO>();
  for (const mi of menu) {
    const cat = mi.product.category;
    if (!map.has(cat.id)) {
      map.set(cat.id, {
        id: cat.id,
        name: cat.name,
        imageUrl: cat.imageUrl,
        items: [],
      });
    }
    map.get(cat.id)!.items.push({
      id: mi.id,
      name: mi.product.name,
      description: mi.product.description,
      imageUrl: mi.product.imageUrl,
      allergens: mi.product.allergens,
      kcal: mi.product.kcal,
      prepMinutes: mi.product.prepMinutes,
      price: mi.price,
      categoryId: cat.id,
      categoryName: cat.name,
      choiceGroups: mi.choiceGroups,
    });
  }
  return [...map.values()];
}
