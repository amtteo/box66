import type { Metadata } from "next";

import { requireActiveStore } from "@/lib/auth/tenancy";
import { Role } from "@/lib/rbac";
import { getMenuItems, getProductsNotInMenu } from "@/lib/menu/queries";
import { MenuItemDialog, type MenuProductOption } from "@/components/admin/menu/menu-item-dialog";
import { MenuTable, type MenuListItem } from "@/components/admin/menu/menu-table";

export const metadata: Metadata = { title: "Menu predajne" };

export default async function MenuPage() {
  const { store } = await requireActiveStore(Role.MANAGER);
  const [menuItems, available] = await Promise.all([
    getMenuItems(store.id),
    getProductsNotInMenu(store.id),
  ]);

  const items: MenuListItem[] = menuItems.map((m) => ({
    menuItemId: m.id,
    productName: m.product.name,
    categoryName: m.product.category.name,
    price: m.price.toString(),
    isAvailable: m.isAvailable,
    sortOrder: m.sortOrder,
    imageUrl: m.product.imageUrl,
    productActive: m.product.isActive,
  }));

  const products: MenuProductOption[] = available.map((p) => ({
    id: p.id,
    name: p.name,
    categoryName: p.category.name,
    suggestedPrice: p.suggestedPrice?.toString() ?? "",
  }));

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Menu predajne</h1>
          <p className="text-sm text-muted-foreground">
            {store.name} — zapni produkty z katalógu, nastav ceny a dostupnosť.
          </p>
        </div>
        <MenuItemDialog storeId={store.id} currency={store.currency} products={products} />
      </div>
      <MenuTable storeId={store.id} currency={store.currency} items={items} />
    </>
  );
}
