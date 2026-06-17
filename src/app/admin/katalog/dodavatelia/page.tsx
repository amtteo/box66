import type { Metadata } from "next";

import { getSuppliers } from "@/lib/suppliers/queries";
import { SupplierDialog } from "@/components/admin/suppliers/supplier-dialog";
import {
  SuppliersTable,
  type SupplierListItem,
} from "@/components/admin/suppliers/suppliers-table";

export const metadata: Metadata = { title: "Dodávatelia — Katalóg" };

export default async function KatalogDodavateliaPage() {
  const suppliers = await getSuppliers();

  const items: SupplierListItem[] = suppliers.map((s) => ({
    id: s.id,
    name: s.name,
    contactName: s.contactName ?? "",
    email: s.email ?? "",
    phone: s.phone ?? "",
    address: s.address ?? "",
    ico: s.ico ?? "",
    dic: s.dic ?? "",
    notes: s.notes ?? "",
    isActive: s.isActive,
    contact: [s.contactName, s.email, s.phone].filter(Boolean).join(" · "),
    storeCount: s._count.storeLinks,
    priceCount: s._count.prices,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium">Dodávatelia</h2>
          <p className="text-sm text-muted-foreground">
            Globálni dodávatelia platformy. Centrála priradí, ktoré predajne od
            ktorého dodávateľa môžu odoberať, a nastaví cenník per predajňa.
          </p>
        </div>
        <SupplierDialog />
      </div>
      <SuppliersTable suppliers={items} basePath="/admin/katalog/dodavatelia" />
    </div>
  );
}
