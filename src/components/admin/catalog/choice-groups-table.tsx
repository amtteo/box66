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
import {
  ChoiceGroupDialog,
  type ChoiceGroupValues,
  type ChoicePoolOption,
} from "@/components/admin/catalog/choice-group-dialog";

export function ChoiceGroupsTable({
  productId,
  pools,
  rows,
  optionCounts,
}: {
  productId: string;
  pools: ChoicePoolOption[];
  rows: ChoiceGroupValues[];
  optionCounts: Record<string, number>;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        {`Tento produkt nemá žiadny výber. Pridaj prvý (napr. „Vyber nápoj“) tlačidlom vpravo hore.`}
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Názov výberu</TableHead>
            <TableHead>Pool</TableHead>
            <TableHead className="text-right">Možnosti</TableHead>
            <TableHead className="text-right">Min / Max</TableHead>
            <TableHead className="w-12 text-right">Akcie</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.label}</TableCell>
              <TableCell className="text-muted-foreground">
                {row.categoryName}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {optionCounts[row.id] ?? 0}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.minSelect} / {row.maxSelect}
              </TableCell>
              <TableCell>
                <div className="flex justify-end">
                  <ChoiceGroupDialog
                    productId={productId}
                    pools={pools}
                    group={row}
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
