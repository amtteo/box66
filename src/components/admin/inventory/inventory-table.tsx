"use client";

import { AlertTriangle, SlidersHorizontal } from "lucide-react";

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
import { ReorderDialog } from "@/components/admin/inventory/reorder-dialog";

export type InventoryListItem = {
  id: string;
  ingredientName: string;
  unit: string;
  quantity: string;
  reorderLevel: string;
  isLow: boolean;
};

export function InventoryTable({ items }: { items: InventoryListItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        Sklad je zatiaľ prázdny. Prvým príjmom („Pohyb skladu“) sa tu objaví stav zásob.
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Surovina</TableHead>
            <TableHead className="text-right">Stav</TableHead>
            <TableHead className="text-right">Min. zásoba</TableHead>
            <TableHead>Upozornenie</TableHead>
            <TableHead className="w-12 text-right">Akcie</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const unitLabel = UNIT_LABEL[item.unit as UnitOfMeasure] ?? item.unit;
            return (
              <TableRow key={item.id}>
              <TableCell className="font-medium">{item.ingredientName}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {item.quantity} {item.unit}
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {item.reorderLevel ? `${item.reorderLevel} ${item.unit}` : "—"}
                </TableCell>
                <TableCell>
                  {item.isLow ? (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="size-3" />
                      Doobjednať
                    </Badge>
                  ) : (
                    <Badge variant="secondary">OK</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <ReorderDialog
                      inventoryItemId={item.id}
                      ingredientName={item.ingredientName}
                      unitLabel={unitLabel}
                      reorderLevel={item.reorderLevel}
                      trigger={
                        <Button variant="ghost" size="icon-sm" title="Hladina doobjednania">
                          <SlidersHorizontal className="size-4" />
                          <span className="sr-only">Hladina doobjednania</span>
                        </Button>
                      }
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
