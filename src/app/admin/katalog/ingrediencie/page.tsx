import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";

import { getGlobalIngredients } from "@/lib/catalog/queries";
import { Button } from "@/components/ui/button";
import { CatalogSplit } from "@/components/admin/catalog/catalog-split";
import { PanelShell } from "@/components/admin/catalog/panel-shell";
import {
  IngredientForm,
  type IngredientFormValues,
} from "@/components/admin/catalog/ingredient-form";
import { IngredientsTable } from "@/components/admin/catalog/ingredients-table";
import { catalogPanelHref } from "@/components/admin/catalog/catalog-panel-url";

export const metadata: Metadata = { title: "Ingrediencie — Katalóg" };

type PageProps = {
  searchParams: Promise<{ panel?: string; item?: string }>;
};

export default async function IngredienciePage({ searchParams }: PageProps) {
  const { panel, item } = await searchParams;
  const ingredients = await getGlobalIngredients();

  const items: IngredientFormValues[] = ingredients.map((i) => ({
    id: i.id,
    name: i.name,
    sku: i.sku ?? "",
    unit: i.unit,
    notes: i.notes ?? "",
    isActive: i.isActive,
    imageUrl: i.imageUrl,
  }));

  let panelContent = null;
  if (panel === "ingredient") {
    if (item === "new") {
        panelContent = (
          <PanelShell key="ingredient-new" title="Nová ingrediencia">
            <IngredientForm key="new" />
          </PanelShell>
        );
    } else if (item) {
      const ingredient = items.find((i) => i.id === item);
      if (ingredient) {
        panelContent = (
          <PanelShell key={item} title={ingredient.name}>
            <IngredientForm key={item} ingredient={ingredient} />
          </PanelShell>
        );
      }
    }
  }

  return (
    <CatalogSplit panel={panelContent}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-medium">Globálne ingrediencie</h2>
            <p className="text-sm text-muted-foreground">
              {items.length === 0
                ? "Žiadne ingrediencie."
                : `${items.length} globálnych ingrediencií.`}
            </p>
          </div>
          <Button asChild>
            <Link
              href={catalogPanelHref("/admin/katalog/ingrediencie", "ingredient", "new")}
            >
              <Plus className="size-4" />
              Nová ingrediencia
            </Link>
          </Button>
        </div>
        <Suspense>
          <IngredientsTable
            ingredients={items}
            selectedId={panel === "ingredient" ? item : null}
          />
        </Suspense>
      </div>
    </CatalogSplit>
  );
}
