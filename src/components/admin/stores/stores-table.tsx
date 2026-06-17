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
import { deleteStore } from "@/lib/stores/actions";
import { DeleteButton } from "@/components/admin/catalog/delete-button";
import { StoreDialog, type StoreFormValues } from "@/components/admin/stores/store-dialog";

export type StoreListItem = StoreFormValues & {
  menuCount: number;
  inventoryCount: number;
  memberCount: number;
};

export function StoresTable({ stores }: { stores: StoreListItem[] }) {
  if (stores.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        Zatiaľ žiadne predajne. Vytvor prvú pomocou tlačidla vpravo hore.
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Predajňa</TableHead>
            <TableHead>Adresa</TableHead>
            <TableHead className="text-right">Menu</TableHead>
            <TableHead className="text-right">Sklad</TableHead>
            <TableHead className="text-right">Tím</TableHead>
            <TableHead>Stav</TableHead>
            <TableHead className="w-20 text-right">Akcie</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stores.map((store) => (
            <TableRow key={store.id}>
              <TableCell>
                <div className="font-medium">{store.name}</div>
                <div className="text-xs text-muted-foreground">{store.currency}</div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {[store.street, store.city].filter(Boolean).join(", ") || "—"}
              </TableCell>
              <TableCell className="text-right tabular-nums">{store.menuCount}</TableCell>
              <TableCell className="text-right tabular-nums">{store.inventoryCount}</TableCell>
              <TableCell className="text-right tabular-nums">{store.memberCount}</TableCell>
              <TableCell>
                <Badge variant={store.isActive ? "default" : "secondary"}>
                  {store.isActive ? "Aktívna" : "Zatvorená"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <StoreDialog
                    store={store}
                    trigger={
                      <Button variant="ghost" size="icon-sm">
                        <Pencil className="size-4" />
                        <span className="sr-only">Upraviť</span>
                      </Button>
                    }
                  />
                  <DeleteButton
                    id={store.id}
                    name={store.name}
                    action={deleteStore}
                    description="Predajňu natrvalo odstránime aj s menu a skladom."
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
