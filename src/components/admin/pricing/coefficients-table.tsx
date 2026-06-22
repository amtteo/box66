"use client";

import { Pencil } from "lucide-react";

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
import { deletePriceCoefficient } from "@/lib/pricing/actions";
import { DeleteButton } from "@/components/admin/catalog/delete-button";
import {
  CoefficientDialog,
  type CoefficientFormValues,
} from "@/components/admin/pricing/coefficient-dialog";

export type CoefficientListItem = CoefficientFormValues & {
  storeCount: number;
};

export function CoefficientsTable({ coefficients }: { coefficients: CoefficientListItem[] }) {
  if (coefficients.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        Zatiaľ žiadne koeficienty.
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Názov</TableHead>
            <TableHead className="text-right">Koeficient</TableHead>
            <TableHead className="text-right">Predajne</TableHead>
            <TableHead className="text-right">Poradie</TableHead>
            <TableHead className="w-20 text-right">Akcie</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {coefficients.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell className="text-right tabular-nums">
                {Number(c.multiplier).toFixed(4).replace(/\.?0+$/, "")}
              </TableCell>
              <TableCell className="text-right">
                <Badge variant="secondary">{c.storeCount}</Badge>
              </TableCell>
              <TableCell className="text-right tabular-nums">{c.sortOrder}</TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <CoefficientDialog
                    coefficient={c}
                    trigger={
                      <Button variant="ghost" size="icon-sm">
                        <Pencil className="size-4" />
                        <span className="sr-only">Upraviť</span>
                      </Button>
                    }
                  />
                  <DeleteButton
                    id={c.id}
                    name={c.name}
                    action={deletePriceCoefficient}
                    description="Koeficient odstránime natrvalo."
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
