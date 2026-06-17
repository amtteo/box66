"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MOVEMENT_LABEL } from "@/lib/inventory/schemas";

export type MovementListItem = {
  id: string;
  createdAt: string;
  type: string;
  ingredientName: string;
  quantity: string;
  unit: string;
  supplierName: string | null;
  reference: string | null;
  by: string | null;
};

export function MovementsList({ movements }: { movements: MovementListItem[] }) {
  if (movements.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Zatiaľ žiadne pohyby skladu.
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Dátum</TableHead>
            <TableHead>Typ</TableHead>
            <TableHead>Surovina</TableHead>
            <TableHead className="text-right">Množstvo</TableHead>
            <TableHead>Dodávateľ / doklad</TableHead>
            <TableHead>Kto</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.map((m) => {
            const qty = Number(m.quantity);
            const positive = qty > 0;
            return (
              <TableRow key={m.id}>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {m.createdAt}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{MOVEMENT_LABEL[m.type] ?? m.type}</Badge>
                </TableCell>
                <TableCell className="font-medium">{m.ingredientName}</TableCell>
                <TableCell
                  className={
                    "text-right tabular-nums " +
                    (positive ? "text-emerald-600" : "text-destructive")
                  }
                >
                  {qty > 0 ? "+" : ""}
                  {m.quantity} {m.unit}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {[m.supplierName, m.reference].filter(Boolean).join(" · ") || "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{m.by ?? "—"}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
