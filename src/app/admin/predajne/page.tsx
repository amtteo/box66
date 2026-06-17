import type { Metadata } from "next";

import { requireActiveOrg } from "@/lib/auth/tenancy";
import { getStoresForOrg } from "@/lib/stores/queries";
import { StoreDialog } from "@/components/admin/stores/store-dialog";
import { StoresTable, type StoreListItem } from "@/components/admin/stores/stores-table";

export const metadata: Metadata = { title: "Predajne" };

export default async function PredajnePage() {
  const { organizationId } = await requireActiveOrg();
  const stores = await getStoresForOrg(organizationId);

  const items: StoreListItem[] = stores.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    street: s.street ?? "",
    city: s.city ?? "",
    postalCode: s.postalCode ?? "",
    country: s.country ?? "SK",
    phone: s.phone ?? "",
    email: s.email ?? "",
    currency: s.currency,
    isActive: s.isActive,
    menuCount: s._count.menuItems,
    inventoryCount: s._count.inventoryItems,
    memberCount: s._count.memberships,
  }));

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Predajne</h1>
          <p className="text-sm text-muted-foreground">
            Prevádzky tvojej organizácie. Po vytvorení ich nájdeš v prepínači
            predajní a môžeš pre ne spravovať menu a sklad.
          </p>
        </div>
        <StoreDialog />
      </div>
      <StoresTable stores={items} />
    </>
  );
}
