"use client";

import Image from "next/image";
import { ImageIcon, Pencil } from "lucide-react";

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
import { removeMenuItem } from "@/lib/menu/actions";
import { DeleteButton } from "@/components/admin/catalog/delete-button";
import {
  MenuItemDialog,
  type MenuItemFormValues,
} from "@/components/admin/menu/menu-item-dialog";

export type MenuListItem = MenuItemFormValues & {
  categoryName: string;
  imageUrl: string | null;
  productActive: boolean;
};

export function MenuTable({
  storeId,
  currency,
  items,
}: {
  storeId: string;
  currency: string;
  items: MenuListItem[];
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        Menu je zatiaľ prázdne. Pridaj produkty z katalógu pomocou tlačidla vpravo hore.
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Produkt</TableHead>
            <TableHead>Kategória</TableHead>
            <TableHead className="text-right">Cena</TableHead>
            <TableHead>Dostupnosť</TableHead>
            <TableHead className="w-20 text-right">Akcie</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.menuItemId}>
              <TableCell>
                <div className="flex size-9 items-center justify-center overflow-hidden rounded-md border bg-muted">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.productName}
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
                {item.productName}
                {!item.productActive && (
                  <Badge variant="outline" className="ml-2 text-[10px]">
                    v katalógu skrytý
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">{item.categoryName}</TableCell>
              <TableCell className="text-right tabular-nums">
                {item.price} {currency}
              </TableCell>
              <TableCell>
                <Badge variant={item.isAvailable ? "default" : "secondary"}>
                  {item.isAvailable ? "Dostupné" : "Nedostupné"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <MenuItemDialog
                    storeId={storeId}
                    currency={currency}
                    item={item}
                    trigger={
                      <Button variant="ghost" size="icon-sm">
                        <Pencil className="size-4" />
                        <span className="sr-only">Upraviť</span>
                      </Button>
                    }
                  />
                  <DeleteButton
                    id={item.menuItemId}
                    name={item.productName}
                    action={removeMenuItem}
                    description="Produkt odstránime z menu tejto predajne (z katalógu ostáva)."
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
