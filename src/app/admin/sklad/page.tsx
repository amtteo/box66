import type { Metadata } from "next";

import { requireActiveStore } from "@/lib/auth/tenancy";
import { Role } from "@/lib/rbac";
import { getInventory, getStockMovements, getMenuProductsForWaste } from "@/lib/inventory/queries";
import { getActiveIngredients } from "@/lib/catalog/queries";
import { getStoreSupplierOptions } from "@/lib/suppliers/queries";
import { MovementDialog } from "@/components/admin/inventory/movement-dialog";
import {
  InventoryTable,
  type InventoryListItem,
} from "@/components/admin/inventory/inventory-table";
import {
  MovementsList,
  type MovementListItem,
} from "@/components/admin/inventory/movements-list";

export const metadata: Metadata = { title: "Sklad predajne" };

const dateFmt = new Intl.DateTimeFormat("sk-SK", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function SkladPage() {
  const { store } = await requireActiveStore(Role.MANAGER);
  const [inventory, movements, ingredients, suppliers, productsWithRecipes] = await Promise.all([
    getInventory(store.id),
    getStockMovements(store.id),
    getActiveIngredients(),
    getStoreSupplierOptions(store.id),
    getMenuProductsForWaste(store.id),
  ]);

  const inventoryItems: InventoryListItem[] = inventory.map((i) => {
    const qty = Number(i.quantity);
    const reorder = i.reorderLevel != null ? Number(i.reorderLevel) : null;
    return {
      id: i.id,
      ingredientName: i.ingredient.name,
      unit: i.unit,
      quantity: i.quantity.toString(),
      reorderLevel: i.reorderLevel?.toString() ?? "",
      isLow: reorder != null && qty <= reorder,
    };
  });

  const movementItems: MovementListItem[] = movements.map((m) => ({
    id: m.id,
    createdAt: dateFmt.format(m.createdAt),
    type: m.type,
    ingredientName: m.ingredient.name,
    quantity: m.quantity.toString(),
    unit: m.unit,
    supplierName: m.supplier?.name ?? null,
    reference: m.reference,
    by: m.createdBy?.fullName ?? m.createdBy?.email ?? null,
  }));

  const lowCount = inventoryItems.filter((i) => i.isLow).length;

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sklad predajne</h1>
          <p className="text-sm text-muted-foreground">
            {store.name} — stav zásob a kniha pohybov.
            {lowCount > 0 && ` ${lowCount} ${lowCount === 1 ? "položka je" : "položiek je"} pod hladinou doobjednania.`}
          </p>
        </div>
        <MovementDialog
          storeId={store.id}
          ingredients={ingredients}
          suppliers={suppliers}
          productsWithRecipes={productsWithRecipes}
        />
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Stav skladu</h2>
        <InventoryTable items={inventoryItems} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Posledné pohyby</h2>
        <MovementsList movements={movementItems} />
      </section>
    </>
  );
}
