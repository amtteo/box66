import type { Metadata } from "next";

import { requireActiveStore } from "@/lib/auth/tenancy";
import { getAccess } from "@/lib/auth/dal";
import { Role } from "@/lib/rbac";
import { getMenuItems, getProductsNotInMenu } from "@/lib/menu/queries";
import { MenuItemDialog, type MenuProductOption } from "@/components/admin/menu/menu-item-dialog";
import { MenuTable, type MenuListItem } from "@/components/admin/menu/menu-table";

export const metadata: Metadata = { title: "Menu predajne" };

export default async function MenuPage() {
  const [{ store }, { isSuperAdmin }] = await Promise.all([
    requireActiveStore(Role.MANAGER),
    getAccess(),
  ]);

  const [menuItems, available] = await Promise.all([
    getMenuItems(store.id),
    isSuperAdmin ? getProductsNotInMenu(store.id) : Promise.resolve([]),
  ]);

  const items: MenuListItem[] = menuItems.map((m) => ({
    menuItemId: m.id,
    productName: m.product.name,
    categoryId: m.product.category.id,
    categoryName: m.product.category.name,
    categorySortOrder: m.product.category.sortOrder,
    isAvailable: m.isAvailable,
    imageUrl: m.product.imageUrl,
    productActive: m.product.isActive,
  }));

  const products: MenuProductOption[] = available.map((p) => ({
    id: p.id,
    name: p.name,
    categoryName: p.category.name,
  }));

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Menu predajne</h1>
          <p className="text-sm text-muted-foreground">
            {store.name} —{" "}
            {isSuperAdmin
              ? "priraď produkty z katalógu a spravuj ponuku predajne."
              : "označ produkty ako nedostupné, keď sa minú suroviny."}
          </p>
        </div>
        {isSuperAdmin && (
          <MenuItemDialog storeId={store.id} products={products} />
        )}
      </div>
      <MenuTable items={items} isSuperAdmin={isSuperAdmin} />
    </>
  );
}
