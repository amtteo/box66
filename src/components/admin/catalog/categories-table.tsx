"use client";

import Image from "next/image";
import { ImageIcon, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCatalogPanel } from "@/components/admin/catalog/use-catalog-panel";
import type { CategoryFormValues } from "@/components/admin/catalog/category-form";
import { cn } from "@/lib/utils";

export type CategoryListItem = CategoryFormValues & {
  productCount: number;
};

export function CategoriesTable({
  categories,
  selectedId,
}: {
  categories: CategoryListItem[];
  selectedId?: string | null;
}) {
  const { openPanel } = useCatalogPanel();

  if (categories.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        Zatiaľ žiadne kategórie. Vytvor prvú pomocou tlačidla vpravo hore.
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Názov</TableHead>
            <TableHead className="text-right">Produkty</TableHead>
            <TableHead className="w-12 text-right"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => (
            <TableRow
              key={category.id}
              className={cn(
                "cursor-pointer",
                selectedId === category.id && "bg-muted/50",
              )}
              onClick={() => openPanel("category", category.id)}
            >
              <TableCell>
                <div className="flex size-9 items-center justify-center overflow-hidden rounded-md border bg-muted">
                  {category.imageUrl ? (
                    <Image
                      src={category.imageUrl}
                      alt={category.name}
                      width={36}
                      height={36}
                      className="size-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="size-4 text-muted-foreground" />
                  )}
                </div>
              </TableCell>
              <TableCell className="font-medium">
                <div className="flex flex-col gap-0.5">
                  <span>{category.name}</span>
                  {category.isChoicePool ? (
                    <span className="text-xs text-muted-foreground">Pool výberu</span>
                  ) : null}
                  {!category.showInStorefront ? (
                    <span className="text-xs text-muted-foreground">
                      Iba odmeny / prezentácia
                    </span>
                  ) : null}
                </div>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {category.productCount}
              </TableCell>
              <TableCell>
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      openPanel("category", category.id);
                    }}
                  >
                    <Pencil className="size-4" />
                    <span className="sr-only">Upraviť</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
