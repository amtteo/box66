import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";

import { getProducts, getCategoryOptions, getMenuUpsellProductOptions } from "@/lib/catalog/queries";
import { Button } from "@/components/ui/button";
import { CatalogSplit } from "@/components/admin/catalog/catalog-split";
import { PanelShell } from "@/components/admin/catalog/panel-shell";
import { ProductForm } from "@/components/admin/catalog/product-form";
import { ProductRecipePanel } from "@/components/admin/catalog/product-recipe-panel";
import {
  ProductsTable,
  type ProductListItem,
} from "@/components/admin/catalog/products-table";
import { catalogPanelHref } from "@/components/admin/catalog/catalog-panel-url";

export const metadata: Metadata = { title: "Produkty — Katalóg" };

type PageProps = {
  searchParams: Promise<{ panel?: string; item?: string }>;
};

export default async function ProduktyPage({ searchParams }: PageProps) {
  const { panel, item } = await searchParams;

  const [products, categoryOptions, menuUpsellOptions] = await Promise.all([
    getProducts(),
    getCategoryOptions(),
    getMenuUpsellProductOptions(),
  ]);

  const categories = categoryOptions.map((c) => ({ id: c.id, name: c.name }));

  const items: ProductListItem[] = products.map((p) => ({
    id: p.id,
    categoryId: p.categoryId,
    categoryName: p.category.name,
    name: p.name,
    slug: p.slug,
    description: p.description ?? "",
    basePrice: p.basePrice?.toString() ?? "",
    sku: p.sku ?? "",
    allergens: p.allergens,
    kcal: p.kcal?.toString() ?? "",
    prepMinutes: p.prepMinutes?.toString() ?? "",
    sortOrder: p.sortOrder,
    isActive: p.isActive,
    isComboOption: p.isComboOption,
    menuUpsellProductId: p.menuUpsellProductId,
    imageUrl: p.imageUrl,
    recipe: p.recipe
      ? {
          id: p.recipe.id,
          isActive: p.recipe.isActive,
          itemCount: p.recipe._count.items,
        }
      : null,
  }));

  const withRecipe = items.filter((p) => p.recipe).length;

  const upsellOptions = menuUpsellOptions.map((p) => ({
    id: p.id,
    name: p.name,
    categoryName: p.category.name,
  }));

  let panelContent = null;
  if (panel === "product") {
    if (item === "new") {
        panelContent = (
          <PanelShell key="product-new" title="Nový produkt">
            <ProductForm key="new" categories={categories} menuUpsellOptions={upsellOptions} />
          </PanelShell>
        );
    } else if (item) {
      const product = items.find((p) => p.id === item);
      if (product) {
        panelContent = (
          <PanelShell key={item} title={product.name}>
            <ProductForm
              key={item}
              product={product}
              categories={categories}
              menuUpsellOptions={upsellOptions.filter((o) => o.id !== product.id)}
            />
          </PanelShell>
        );
      }
    }
  } else if (panel === "recipe" && item) {
    panelContent = <ProductRecipePanel key={item} productId={item} />;
  }

  return (
    <CatalogSplit panel={panelContent}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <Button asChild disabled={categories.length === 0}>
            <Link href={catalogPanelHref("/admin/katalog/produkty", "product", "new")}>
              <Plus className="size-4" />
              Nový produkt
            </Link>
          </Button>
        </div>
        <Suspense>
          <ProductsTable
            products={items}
            categories={categories}
            selectedProductId={panel === "product" ? item : null}
            selectedRecipeId={panel === "recipe" ? item : null}
          />
        </Suspense>
      </div>
    </CatalogSplit>
  );
}
