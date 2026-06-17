"use client";

import { Pencil, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
import { deleteSupplierIngredient } from "@/lib/suppliers/actions";
import { DeleteButton } from "@/components/admin/catalog/delete-button";
import {
  SupplierIngredientDialog,
  type PriceListItemValues,
} from "@/components/admin/suppliers/supplier-ingredient-dialog";

export type PriceListRow = PriceListItemValues;

export function SupplierIngredientsTable({
  supplierId,
  storeId,
  ingredients,
  rows,
}: {
  supplierId: string;
  storeId: string;
  ingredients: IngredientOption[];
  rows: PriceListRow[];
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        Cenník je zatiaľ prázdny. Pridaj suroviny, ktoré dodávateľ dodáva.
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Surovina</TableHead>
            <TableHead>Balenie</TableHead>
            <TableHead className="text-right">Cena</TableHead>
            <TableHead className="text-right">Dodanie</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead className="w-20 text-right">Akcie</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const unit = row.packageUnit
              ? (UNIT_LABEL[row.packageUnit as UnitOfMeasure] ?? row.packageUnit)
              : "";
            return (
              <TableRow key={row.id}>
                <TableCell className="font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    {row.isPreferred && <Star className="size-3.5 fill-amber-400 text-amber-400" />}
                    {row.ingredientName}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {row.packageSize ? `${row.packageSize} ${unit}`.trim() : "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.price ? `${row.price} €` : "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {row.leadTimeDays ? `${row.leadTimeDays} d` : "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{row.sku || "—"}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    {row.isPreferred && (
                      <Badge variant="outline" className="mr-1 text-[10px]">
                        preferovaný
                      </Badge>
                    )}
                    <SupplierIngredientDialog
                      supplierId={supplierId}
                      storeId={storeId}
                      ingredients={ingredients}
                      item={row}
                      trigger={
                        <Button variant="ghost" size="icon-sm">
                          <Pencil className="size-4" />
                          <span className="sr-only">Upraviť</span>
                        </Button>
                      }
                    />
                    <DeleteButton
                      id={row.id}
                      name={row.ingredientName}
                      action={deleteSupplierIngredient}
                      description="Položku odstránime z cenníka dodávateľa."
                    />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
