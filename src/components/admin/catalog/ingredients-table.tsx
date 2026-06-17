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
import type { IngredientFormValues } from "@/components/admin/catalog/ingredient-form";
import { UNIT_LABEL } from "@/lib/catalog/schemas";
import type { UnitOfMeasure } from "@/generated/prisma/enums";
import { useCatalogPanel } from "@/components/admin/catalog/use-catalog-panel";
import { cn } from "@/lib/utils";

export function IngredientsTable({
  ingredients,
  selectedId,
}: {
  ingredients: IngredientFormValues[];
  selectedId?: string | null;
}) {
  const { openPanel } = useCatalogPanel();

  if (ingredients.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        Zatiaľ žiadne globálne ingrediencie. Vytvor prvú pomocou tlačidla vpravo
        hore.
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
            <TableHead>Jednotka</TableHead>
            <TableHead className="w-12 text-right"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ingredients.map((ingredient) => (
            <TableRow
              key={ingredient.id}
              className={cn(
                "cursor-pointer",
                selectedId === ingredient.id && "bg-muted/50",
              )}
              onClick={() => openPanel("ingredient", ingredient.id)}
            >
              <TableCell>
                <div className="flex size-9 items-center justify-center overflow-hidden rounded-md border bg-muted">
                  {ingredient.imageUrl ? (
                    <Image
                      src={ingredient.imageUrl}
                      alt={ingredient.name}
                      width={36}
                      height={36}
                      className="size-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="size-4 text-muted-foreground" />
                  )}
                </div>
              </TableCell>
              <TableCell className="font-medium">{ingredient.name}</TableCell>
              <TableCell>
                {UNIT_LABEL[ingredient.unit as UnitOfMeasure] ?? ingredient.unit}
              </TableCell>
              <TableCell>
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      openPanel("ingredient", ingredient.id);
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
