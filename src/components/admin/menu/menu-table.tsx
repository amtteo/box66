"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { removeMenuItem } from "@/lib/menu/actions";
import { DeleteButton } from "@/components/admin/catalog/delete-button";
import { MenuAvailabilitySwitch } from "@/components/admin/menu/menu-availability-switch";
import { MenuPriceEditor } from "@/components/admin/menu/menu-price-editor";

export type MenuListItem = {
  menuItemId: string;
  productName: string;
  categoryId: string;
  categoryName: string;
  categorySortOrder: number;
  isAvailable: boolean;
  imageUrl: string | null;
  productActive: boolean;
  effectivePrice: number | null;
  customPrice: string | null;
};

type CategoryGroup = {
  id: string;
  name: string;
  sortOrder: number;
  items: MenuListItem[];
};

function groupByCategory(items: MenuListItem[]): CategoryGroup[] {
  const map = new Map<string, CategoryGroup>();
  for (const item of items) {
    let group = map.get(item.categoryId);
    if (!group) {
      group = {
        id: item.categoryId,
        name: item.categoryName,
        sortOrder: item.categorySortOrder,
        items: [],
      };
      map.set(item.categoryId, group);
    }
    group.items.push(item);
  }
  return [...map.values()].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "sk"),
  );
}

function MenuItemCard({
  item,
  isSuperAdmin,
  currency,
}: {
  item: MenuListItem;
  isSuperAdmin: boolean;
  currency: string;
}) {
  const [isAvailable, setIsAvailable] = useState(item.isAvailable);

  useEffect(() => {
    setIsAvailable(item.isAvailable);
  }, [item.isAvailable]);

  return (
    <article
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border bg-card",
        !isAvailable && "opacity-60",
      )}
    >
      <div className="relative aspect-square w-full bg-muted/40">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.productName}
            fill
            sizes="(max-width: 1024px) 33vw, 20vw"
            className="object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ImageIcon className="size-10 text-muted-foreground/60" />
          </div>
        )}
        {isSuperAdmin && (
          <div className="absolute top-1.5 right-1.5">
            <DeleteButton
              id={item.menuItemId}
              name={item.productName}
              action={removeMenuItem}
              description="Produkt odstránime z menu tejto predajne (z katalógu ostáva)."
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 px-2.5 py-2">
        <div className="min-w-0 text-left">
          <p className="truncate text-sm font-medium leading-tight">{item.productName}</p>
          {!item.productActive && (
            <Badge variant="outline" className="mt-1 text-[10px]">
              skrytý
            </Badge>
          )}
        </div>
        <MenuAvailabilitySwitch
          menuItemId={item.menuItemId}
          isAvailable={isAvailable}
          onAvailabilityChange={setIsAvailable}
          compact
        />
      </div>

      {isSuperAdmin && (
        <MenuPriceEditor
          menuItemId={item.menuItemId}
          effectivePrice={item.effectivePrice}
          customPrice={item.customPrice}
          currency={currency}
        />
      )}
    </article>
  );
}

export function MenuTable({
  items,
  isSuperAdmin,
  currency,
}: {
  items: MenuListItem[];
  isSuperAdmin: boolean;
  currency: string;
}) {
  const groups = useMemo(() => groupByCategory(items), [items]);

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        {isSuperAdmin
          ? "Menu je zatiaľ prázdne. Priraď produkty z katalógu pomocou tlačidla vpravo hore."
          : "Centrála ešte nepriradila žiadne produkty do menu tejto predajne."}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.id}>
          <h2 className="mb-3 text-sm font-semibold tracking-tight">{group.name}</h2>
          <div className="grid grid-cols-3 gap-3 lg:grid-cols-5 lg:gap-4">
            {group.items.map((item) => (
              <MenuItemCard
                key={item.menuItemId}
                item={item}
                isSuperAdmin={isSuperAdmin}
                currency={currency}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
