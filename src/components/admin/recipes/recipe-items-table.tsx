"use client";

import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UNIT_LABEL } from "@/lib/catalog/schemas";
import type { UnitOfMeasure } from "@/generated/prisma/enums";
import type { IngredientOption } from "@/lib/catalog/queries";
import {
  RecipeItemDialog,
  type RecipeItemValues,
} from "@/components/admin/recipes/recipe-item-dialog";

export function RecipeItemsTable({
  recipeId,
  ingredients,
  rows,
}: {
  recipeId: string;
  ingredients: IngredientOption[];
  rows: RecipeItemValues[];
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        Receptúra zatiaľ nemá suroviny. Pridaj prvú pomocou tlačidla vpravo hore.
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.ingredientName}</TableCell>
              <TableCell className="text-right tabular-nums">
                {row.quantity} {UNIT_LABEL[row.unit as UnitOfMeasure] ?? row.unit}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{row.notes || "—"}</TableCell>
              <TableCell>
                <div className="flex justify-end">
                  <RecipeItemDialog
                    recipeId={recipeId}
                    ingredients={ingredients}
                    item={row}
                    trigger={
                      <Button variant="ghost" size="icon-sm">
                        <Pencil className="size-4" />
                        <span className="sr-only">Upraviť</span>
                      </Button>
                    }
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
