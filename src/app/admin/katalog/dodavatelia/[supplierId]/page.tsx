import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";

import {
  getSupplierById,
  getSupplierPrices,
  getAllStoresForAssignment,
} from "@/lib/suppliers/queries";
import { getActiveIngredients } from "@/lib/catalog/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SupplierDialog } from "@/components/admin/suppliers/supplier-dialog";
import { SupplierStoresForm } from "@/components/admin/suppliers/supplier-stores-form";
import { SupplierIngredientDialog } from "@/components/admin/suppliers/supplier-ingredient-dialog";
import {
  SupplierIngredientsTable,
  type PriceListRow,
} from "@/components/admin/suppliers/supplier-ingredients-table";

export const metadata: Metadata = { title: "Dodávateľ — Katalóg" };

export default async function KatalogSupplierDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ supplierId: string }>;
  searchParams: Promise<{ store?: string }>;
}) {
  const { supplierId } = await params;
  const { store: storeParam } = await searchParams;

  const supplier = await getSupplierById(supplierId);
  if (!supplier) notFound();

  const [allStores, ingredients] = await Promise.all([
    getAllStoresForAssignment(),
    getActiveIngredients(),
  ]);

  const assignedIds = supplier.storeLinks
    .filter((l) => l.isActive)
    .map((l) => l.storeId);

  const assignedStores = allStores.filter((s) => assignedIds.includes(s.id));
  const activeStoreId =
    storeParam && assignedIds.includes(storeParam)
      ? storeParam
      : assignedStores[0]?.id;

  const priceList = activeStoreId
    ? await getSupplierPrices(supplierId, activeStoreId)
    : [];

  const rows: PriceListRow[] = priceList.map((r) => ({
    id: r.id,
    storeId: r.storeId,
    ingredientId: r.ingredient.id,
    ingredientName: r.ingredient.name,
    sku: r.sku ?? "",
    packageSize: r.packageSize?.toString() ?? "",
    packageUnit: r.packageUnit ?? "",
    price: r.price?.toString() ?? "",
    leadTimeDays: r.leadTimeDays?.toString() ?? "",
    isPreferred: r.isPreferred,
  }));

  const supplierForm = {
    id: supplier.id,
    name: supplier.name,
    contactName: supplier.contactName ?? "",
    email: supplier.email ?? "",
    phone: supplier.phone ?? "",
    address: supplier.address ?? "",
    ico: supplier.ico ?? "",
    dic: supplier.dic ?? "",
    notes: supplier.notes ?? "",
    isActive: supplier.isActive,
  };

  const storeOptions = allStores.map((s) => ({
    id: s.id,
    label: `${s.organization.name} · ${s.name}${s.city ? ` (${s.city})` : ""}`,
  }));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2 text-muted-foreground">
          <Link href="/admin/katalog/dodavatelia">
            <ArrowLeft className="size-4" />
            Späť na dodávateľov
          </Link>
        </Button>
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-medium">{supplier.name}</h2>
              <Badge variant={supplier.isActive ? "default" : "secondary"}>
                {supplier.isActive ? "Aktívny" : "Neaktívny"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {[supplier.contactName, supplier.email, supplier.phone]
                .filter(Boolean)
                .join(" · ") || "Globálny dodávateľ platformy"}
            </p>
          </div>
          <SupplierDialog
            supplier={supplierForm}
            trigger={
              <Button variant="outline" size="sm">
                <Pencil className="size-4" />
                Upraviť
              </Button>
            }
          />
        </div>
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-medium">Schválené predajne</h3>
        <p className="text-sm text-muted-foreground">
          Vyber predajne, ktoré môžu od tohto dodávateľa odoberať tovar.
        </p>
        <SupplierStoresForm
          supplierId={supplier.id}
          stores={storeOptions}
          assignedIds={assignedIds}
        />
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-medium">Cenník</h3>
            <p className="text-sm text-muted-foreground">
              Ceny sa líšia podľa predajne — vyber predajňu a spravuj položky.
            </p>
          </div>
          {activeStoreId && (
            <SupplierIngredientDialog
              supplierId={supplier.id}
              storeId={activeStoreId}
              ingredients={ingredients}
            />
          )}
        </div>

        {assignedStores.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Najprv priraď aspoň jednu predajňu, potom môžeš nastaviť cenník.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {assignedStores.map((s) => (
                <Button
                  key={s.id}
                  variant={s.id === activeStoreId ? "default" : "outline"}
                  size="sm"
                  asChild
                >
                  <Link href={`/admin/katalog/dodavatelia/${supplierId}?store=${s.id}`}>
                    {s.name}
                    {s.city ? ` · ${s.city}` : ""}
                  </Link>
                </Button>
              ))}
            </div>
            {activeStoreId && (
              <SupplierIngredientsTable
                supplierId={supplier.id}
                storeId={activeStoreId}
                ingredients={ingredients}
                rows={rows}
              />
            )}
          </>
        )}
      </section>
    </div>
  );
}
