import type { Metadata } from "next";

import { requireActiveStore } from "@/lib/auth/tenancy";
import { Role } from "@/lib/rbac";
import { getPublicMenu } from "@/lib/orders/queries";
import { buildMenuCategories } from "@/lib/orders/menu-dto";
import { PosBoard } from "@/components/admin/pos/pos-board";

export const metadata: Metadata = { title: "Pokladňa (POS)" };

export default async function PokladnaPage() {
  const { store } = await requireActiveStore(Role.STAFF);
  const menu = await getPublicMenu(store.id);
  const categories = buildMenuCategories(menu).filter(
    (c) => c.items.length > 0,
  );

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pokladňa</h1>
        <p className="text-sm text-muted-foreground">
          {store.name} — objednávky idú cez Order API, automaticky sa potvrdia a
          zobrazia v kuchyni.
        </p>
      </div>

      {categories.length === 0 ? (
        <p className="text-muted-foreground">
          V menu nie sú dostupné položky. Skontroluj predajňu v admine.
        </p>
      ) : (
        <PosBoard
          storeId={store.id}
          storeName={store.name}
          currency={store.currency}
          categories={categories}
        />
      )}
    </>
  );
}
