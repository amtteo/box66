"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageIcon, Plus } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ALLERGENS } from "@/lib/catalog/schemas";
import {
  formatMoney,
  type MenuCategoryDTO,
  type MenuItemDTO,
} from "@/lib/orders/types";
import { useCart } from "@/components/storefront/cart-context";
import { ComboChoiceDialog } from "@/components/storefront/combo-choice-dialog";

const ALLERGEN_LABEL = new Map(ALLERGENS.map((a) => [a.code, a.label]));

export function MenuBoard({
  categories,
  currency,
}: {
  categories: MenuCategoryDTO[];
  currency: string;
}) {
  const { add } = useCart();
  const [comboItem, setComboItem] = useState<MenuItemDTO | null>(null);

  function handleAdd(item: MenuItemDTO) {
    if (item.choiceGroups.length > 0) {
      setComboItem(item);
      return;
    }
    add(item);
    toast.success(`„${item.name}" pridané do košíka.`);
  }

  if (categories.length === 0) {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 py-16">
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          Menu zatiaľ nie je dostupné. Skúste to neskôr.
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="mx-auto w-full max-w-5xl space-y-12 px-6 py-12">
      {categories.map((category) => (
        <section key={category.id} id={`kat-${category.id}`} className="space-y-5">
          <h2 className="text-2xl font-semibold tracking-tight">
            {category.name}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {category.items.map((item) => (
              <Card key={item.id} className="overflow-hidden pt-0">
                <div className="relative aspect-[4/3] w-full bg-muted">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <ImageIcon className="size-10 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <CardContent className="flex flex-1 flex-col gap-3">
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium leading-tight">{item.name}</h3>
                      <span className="shrink-0 font-semibold tabular-nums">
                        {formatMoney(item.price, currency)}
                      </span>
                    </div>
                    {item.description && (
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {item.kcal != null && (
                      <Badge variant="secondary" className="font-normal">
                        {item.kcal} kcal
                      </Badge>
                    )}
                    {item.allergens.slice(0, 3).map((code) => (
                      <Badge
                        key={code}
                        variant="outline"
                        className="font-normal"
                        title={ALLERGEN_LABEL.get(code) ?? code}
                      >
                        {ALLERGEN_LABEL.get(code) ?? code}
                      </Badge>
                    ))}
                    {item.allergens.length > 3 && (
                      <Badge variant="outline" className="font-normal">
                        +{item.allergens.length - 3}
                      </Badge>
                    )}
                  </div>

                  <Button
                    className="mt-auto w-full"
                    onClick={() => handleAdd(item)}
                  >
                    <Plus className="size-4" />
                    {item.choiceGroups.length > 0 ? "Vybrať" : "Pridať"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
    <ComboChoiceDialog
      item={comboItem}
      currency={currency}
      onClose={() => setComboItem(null)}
    />
    </>
  );
}
