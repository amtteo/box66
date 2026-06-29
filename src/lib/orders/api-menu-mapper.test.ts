import { describe, expect, it } from "vitest";
import { mapApiMenuToPublicMenu } from "@/lib/orders/api-menu-mapper";
import type { ApiMenuResponse } from "@/lib/orders/api-types";

describe("mapApiMenuToPublicMenu", () => {
  it("maps choice groups and filters unavailable options", () => {
    const menu: ApiMenuResponse = {
      storeId: "store-1",
      storeName: "Test",
      currency: "EUR",
      items: [
        {
          id: "mi-1",
          productId: "p-1",
          name: "Combo",
          categoryId: "c-1",
          categoryName: "Menu",
          price: "9.99",
          isAvailable: true,
          sortOrder: 1,
          choiceGroups: [
            {
              id: "g-1",
              label: "Príloha",
              minSelect: 1,
              maxSelect: 1,
              sortOrder: 0,
              options: [
                {
                  productId: "p-2",
                  menuItemId: "mi-2",
                  name: "Ryža",
                  isAvailable: true,
                },
                {
                  productId: "p-3",
                  menuItemId: null,
                  name: "Nedostupné",
                  isAvailable: false,
                },
              ],
            },
          ],
        },
      ],
    };

    const items = mapApiMenuToPublicMenu(menu);
    expect(items).toHaveLength(1);
    expect(items[0].price).toBe(9.99);
    expect(items[0].choiceGroups).toHaveLength(1);
    expect(items[0].choiceGroups[0].options).toHaveLength(1);
    expect(items[0].choiceGroups[0].options[0].menuItemId).toBe("mi-2");
  });
});
