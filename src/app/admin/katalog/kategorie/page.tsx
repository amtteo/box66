import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";

import { getCategories } from "@/lib/catalog/queries";
import { Button } from "@/components/ui/button";
import { CatalogSplit } from "@/components/admin/catalog/catalog-split";
import { PanelShell } from "@/components/admin/catalog/panel-shell";
import { CategoryForm } from "@/components/admin/catalog/category-form";
import {
  CategoriesTable,
  type CategoryListItem,
} from "@/components/admin/catalog/categories-table";
import { catalogPanelHref } from "@/components/admin/catalog/catalog-panel-url";

export const metadata: Metadata = { title: "Kategórie — Katalóg" };

type PageProps = {
  searchParams: Promise<{ panel?: string; item?: string }>;
};

export default async function KategoriePage({ searchParams }: PageProps) {
  const { panel, item } = await searchParams;
  const categories = await getCategories();

  const items: CategoryListItem[] = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description ?? "",
    sortOrder: c.sortOrder,
    isActive: c.isActive,
    isChoicePool: c.isChoicePool,
    imageUrl: c.imageUrl,
    productCount: c._count.products,
  }));

  let panelContent = null;
  if (panel === "category") {
    if (item === "new") {
        panelContent = (
          <PanelShell key="category-new" title="Nová kategória">
            <CategoryForm key="new" />
          </PanelShell>
        );
    } else if (item) {
      const category = items.find((c) => c.id === item);
      if (category) {
        panelContent = (
          <PanelShell key={item} title={category.name}>
            <CategoryForm key={item} category={category} />
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
            <h2 className="text-lg font-medium">Kategórie</h2>
            <p className="text-sm text-muted-foreground">
              {items.length === 0
                ? "Žiadne kategórie."
                : `${items.length} kategórií v katalógu.`}
            </p>
          </div>
          <Button asChild>
            <Link href={catalogPanelHref("/admin/katalog/kategorie", "category", "new")}>
              <Plus className="size-4" />
              Nová kategória
            </Link>
          </Button>
        </div>
        <Suspense>
          <CategoriesTable
            categories={items}
            selectedId={panel === "category" ? item : null}
          />
        </Suspense>
      </div>
    </CatalogSplit>
  );
}
