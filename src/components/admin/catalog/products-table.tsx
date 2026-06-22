"use client";

import { Fragment } from "react";
import Image from "next/image";
import { ImageIcon, Pencil, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import type {
  CategoryOption,
  ProductFormValues,
} from "@/components/admin/catalog/product-form";
import { useCatalogPanel } from "@/components/admin/catalog/use-catalog-panel";
import { RecipeDialog } from "@/components/admin/recipes/recipe-dialog";
import { cn } from "@/lib/utils";

export type ProductRecipeSummary = {
  id: string;
  isActive: boolean;
  itemCount: number;
};

export type ProductListItem = ProductFormValues & {
  categoryName: string;
  recipe: ProductRecipeSummary | null;
};

function sortProducts(products: ProductListItem[]) {
  return [...products].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.name.localeCompare(b.name, "sk");
  });
}

function groupProductsByCategory(
  products: ProductListItem[],
  categories: CategoryOption[],
) {
  const byCategory = new Map<string, ProductListItem[]>();

  for (const product of products) {
    const list = byCategory.get(product.categoryId) ?? [];
    list.push(product);
    byCategory.set(product.categoryId, list);
  }

  const groups: { categoryId: string; categoryName: string; products: ProductListItem[] }[] =
    [];

  for (const category of categories) {
    const categoryProducts = byCategory.get(category.id);
    if (!categoryProducts?.length) continue;
    groups.push({
      categoryId: category.id,
      categoryName: category.name,
      products: sortProducts(categoryProducts),
    });
    byCategory.delete(category.id);
  }

  for (const [categoryId, categoryProducts] of byCategory) {
    groups.push({
      categoryId,
      categoryName: categoryProducts[0]?.categoryName ?? "Bez kategórie",
      products: sortProducts(categoryProducts),
    });
  }

  return groups;
}

function RecipeButton({ product }: { product: ProductListItem }) {
  const { openPanel } = useCatalogPanel();
  const { recipe } = product;

  if (recipe) {
    const label =
      recipe.itemCount === 0
        ? "Bez surovín"
        : `${recipe.itemCount} ${recipe.itemCount === 1 ? "surovina" : "surovín"}`;

    return (
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 tabular-nums"
        onClick={() => openPanel("recipe", product.id)}
      >
        <span>{label}</span>
        <Pencil className="size-3.5 opacity-60" />
      </Button>
    );
  }

  if (!product.isActive) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  return (
    <RecipeDialog
      productId={product.id}
      productName={product.name}
      trigger={
        <Button variant="outline" size="sm" className="h-8 gap-1.5">
          <Plus className="size-3.5" />
          Receptúra
        </Button>
      }
    />
  );
}

function PriceButton({ product }: { product: ProductListItem }) {
  const { openPanel } = useCatalogPanel();

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 gap-1.5 tabular-nums"
      onClick={() => openPanel("product", product.id)}
    >
      <span>{product.basePrice ? `${product.basePrice} €` : "Cena"}</span>
      <Pencil className="size-3.5 opacity-60" />
    </Button>
  );
}

function ProductRow({
  product,
  selectedProductId,
  selectedRecipeId,
}: {
  product: ProductListItem;
  selectedProductId?: string | null;
  selectedRecipeId?: string | null;
}) {
  const isSelected =
    selectedProductId === product.id || selectedRecipeId === product.id;

  return (
    <TableRow className={cn(isSelected && "bg-muted/50")}>
      <TableCell>
        <div className="flex size-9 items-center justify-center overflow-hidden rounded-md border bg-muted">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              width={36}
              height={36}
              className="size-full object-cover"
            />
          ) : (
            <ImageIcon className="size-4 text-muted-foreground" />
          )}
        </div>
      </TableCell>
      <TableCell className="font-medium">{product.name}</TableCell>
      <TableCell className="w-0 whitespace-nowrap text-right">
        <div className="flex justify-end gap-1">
          <PriceButton product={product} />
          <RecipeButton product={product} />
        </div>
      </TableCell>
    </TableRow>
  );
}

export function ProductsTable({
  products,
  categories,
  selectedProductId,
  selectedRecipeId,
}: {
  products: ProductListItem[];
  categories: CategoryOption[];
  selectedProductId?: string | null;
  selectedRecipeId?: string | null;
}) {
  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        {categories.length === 0
          ? "Najprv vytvor aspoň jednu kategóriu, potom môžeš pridávať produkty."
          : "Zatiaľ žiadne produkty. Vytvor prvý pomocou tlačidla vpravo hore."}
      </div>
    );
  }

  const groups = groupProductsByCategory(products, categories);

  return (
    <div className="rounded-lg border">
      <Table>
        <TableBody>
          {groups.map((group) => (
            <Fragment key={group.categoryId}>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableCell colSpan={3} className="py-2">
                  <span className="font-medium">{group.categoryName}</span>
                  <span className="ml-2 text-sm text-muted-foreground">
                    {group.products.length}
                  </span>
                </TableCell>
              </TableRow>
              {group.products.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  selectedProductId={selectedProductId}
                  selectedRecipeId={selectedRecipeId}
                />
              ))}
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
