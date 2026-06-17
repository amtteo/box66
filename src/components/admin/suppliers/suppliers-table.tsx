"use client";

import Link from "next/link";
import { ListOrdered, Pencil } from "lucide-react";

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
import { deleteSupplier } from "@/lib/suppliers/actions";
import { DeleteButton } from "@/components/admin/catalog/delete-button";
import {
  SupplierDialog,
  type SupplierFormValues,
} from "@/components/admin/suppliers/supplier-dialog";

export type SupplierListItem = SupplierFormValues & {
  contact: string;
  storeCount: number;
  priceCount: number;
};

export function SuppliersTable({
  suppliers,
  basePath = "/admin/katalog/dodavatelia",
}: {
  suppliers: SupplierListItem[];
  basePath?: string;
}) {
  if (suppliers.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        Zatiaľ žiadni dodávatelia. Vytvor prvého pomocou tlačidla vpravo hore.
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Dodávateľ</TableHead>
            <TableHead>Kontakt</TableHead>
            <TableHead className="text-right">Predajne</TableHead>
            <TableHead className="text-right">Cenník</TableHead>
            <TableHead>Stav</TableHead>
            <TableHead className="w-28 text-right">Akcie</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suppliers.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="font-medium">{s.name}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{s.contact || "—"}</TableCell>
              <TableCell className="text-right tabular-nums">{s.storeCount}</TableCell>
              <TableCell className="text-right tabular-nums">{s.priceCount}</TableCell>
              <TableCell>
                <Badge variant={s.isActive ? "default" : "secondary"}>
                  {s.isActive ? "Aktívny" : "Neaktívny"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon-sm" asChild title="Detail">
                    <Link href={`${basePath}/${s.id}`}>
                      <ListOrdered className="size-4" />
                      <span className="sr-only">Detail</span>
                    </Link>
                  </Button>
                  <SupplierDialog
                    supplier={s}
                    trigger={
                      <Button variant="ghost" size="icon-sm">
                        <Pencil className="size-4" />
                        <span className="sr-only">Upraviť</span>
                      </Button>
                    }
                  />
                  <DeleteButton
                    id={s.id}
                    name={s.name}
                    action={deleteSupplier}
                    description="Dodávateľa natrvalo odstránime aj s priradeniami a cenníkom."
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
