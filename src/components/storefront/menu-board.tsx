"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Flame, ImageIcon, Info, Plus, Wheat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ALLERGENS } from "@/lib/catalog/schemas";
import { cn } from "@/lib/utils";
import {
  formatMoney,
  type MenuCategoryDTO,
  type MenuItemDTO,
} from "@/lib/orders/types";
import { showCartAddedToast } from "@/components/storefront/cart-added-toast";
import { useCart } from "@/components/storefront/cart-context";
import { ComboChoiceDialog } from "@/components/storefront/combo-choice-dialog";

const ALLERGEN_LABEL = new Map(ALLERGENS.map((a) => [a.code, a.label]));

function ItemInfoPopover({ item }: { item: MenuItemDTO }) {
  const hasKcal = item.kcal != null;
  const hasAllergens = item.allergens.length > 0;
  if (!hasKcal && !hasAllergens) return null;

  const allergenLabels = item.allergens.map(
    (code) => ALLERGEN_LABEL.get(code) ?? code,
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          className="rounded-full absolute left-2 top-2 transition-colors text-muted-foregroundx bg-transparent hover:bg-muted"
          aria-label="Informácie o položke"
        >
          <Info className="size-6" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="border-none bg-amber-100 custom-shadow p-10 rounded-xl" side="top" align="start">
        <p className="mb-3 text-sm font-semibold">Hodnoty</p>
        <div className="space-y-3">
          {hasKcal && (
            <div className="flex items-start gap-2.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-200">
                <Flame className="size-4 " />
              </div>
              <div className="min-w-0">
                <p className="text-xs">Energia</p>
                <p className="text-sm font-medium">{item.kcal} kcal</p>
              </div>
            </div>
          )}
          {hasAllergens && (
            <div className="flex items-start gap-2.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-200">
                <Wheat className="size-4 " />
              </div>
              <div className="min-w-0">
                <p className="text-xs">Alergény</p>
                <p className="text-sm font-medium">{allergenLabels.join(", ")}</p>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function CategoryTab({
  category,
  isActive,
  onClick,
  layout,
}: {
  category: MenuCategoryDTO;
  isActive: boolean;
  onClick: () => void;
  layout: "mobile" | "desktop";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex shrink-0 flex-col items-center gap-2 transition-colors",
        layout === "mobile"
          ? "w-[76px] px-1 py-2"
          : "w-full px-3 py-3.5",
        isActive
          ? layout === "mobile"
            ? "border-2 border-primary"
            : "border-2 border-primary"
          : layout === "desktop"
            ? "border-2 border-transparent"
            : "border-2 border-transparent",
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden",
          layout === "mobile" ? "size-14" : "size-20",
          isActive && "ring-primary/30",
        )}
      >
        {category.imageUrl ? (
          <Image
            src={category.imageUrl}
            alt=""
            fill
            sizes={layout === "mobile" ? "56px" : "80px"}
            className="object-contain"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ImageIcon
              className={cn(
                "text-muted-foreground",
                layout === "mobile" ? "size-7" : "size-9",
              )}
            />
          </div>
        )}
      </div>
      <span
        className={cn(
          "line-clamp-2 text-center leading-tight",
          layout === "mobile" ? "text-xs" : "text-sm",
          isActive ? "font-semibold text-foreground" : "text-muted-foreground",
        )}
      >
        {category.name}
      </span>
    </button>
  );
}

function MenuItemCard({
  item,
  currency,
  onAdd,
}: {
  item: MenuItemDTO;
  currency: string;
  onAdd: (item: MenuItemDTO) => void;
}) {
  return (
    <Card className="overflow-hidden pt-0 shadow-none border-0 border-r-2 border-b-2 border-primary rounded-none relative">
      <div className="relative aspect-[4/3] w-full">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-contain"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ImageIcon className="size-10 text-muted-foreground" />
          </div>
        )}
      </div>
      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="flex flex-col items-center gap-0.5 text-center">
          <h3 className="font-medium leading-tight">{item.name}</h3>
          <span className="font-semibold tabular-nums">
            {formatMoney(item.price, currency)}
          </span>
        </div>

        <div className="mt-auto flex items-center justify-center gap-2">
          <ItemInfoPopover item={item} />
          <Button
            size="icon"
            className="rounded-full bg-red-500 hover:bg-red-600"
            onClick={() => onAdd(item)}
          >
            <Plus className="size-6 text-white" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function MenuBoard({
  categories,
  currency,
}: {
  categories: MenuCategoryDTO[];
  currency: string;
}) {
  const { add } = useCart();
  const [comboItem, setComboItem] = useState<MenuItemDTO | null>(null);
  const [activeId, setActiveId] = useState(categories[0]?.id ?? "");
  const mobileTabRefs = useRef(new Map<string, HTMLButtonElement>());

  const activeCategory =
    categories.find((c) => c.id === activeId) ?? categories[0];

  useEffect(() => {
    const el = mobileTabRefs.current.get(activeId);
    el?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeId]);

  function handleAdd(item: MenuItemDTO) {
    if (item.choiceGroups.length > 0) {
      setComboItem(item);
      return;
    }
    add(item);
    showCartAddedToast(item.name);
  }

  if (categories.length === 0) {
    return (
      <div className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          Menu zatiaľ nie je dostupné. Skúste to neskôr.
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto w-full max-w-6xl">
        <div className="sticky top-16 z-30 border-b-2 border-primary bg-background md:hidden">
          <div className="flex gap-1 overflow-x-auto px-3 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categories.map((category) => (
              <div
                key={category.id}
                ref={(el) => {
                  const btn = el?.querySelector("button");
                  if (btn) mobileTabRefs.current.set(category.id, btn);
                  else mobileTabRefs.current.delete(category.id);
                }}
              >
                <CategoryTab
                  category={category}
                  isActive={category.id === activeId}
                  layout="mobile"
                  onClick={() => setActiveId(category.id)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex min-h-[calc(100dvh-4rem)]">
          <aside className="hidden text-white w-[148px] shrink-0 border-r-2 border-primary md:block lg:w-[160px] pl-3">
            <nav className="sticky top-16 flex flex-col gap-1 p-3">
              {categories.map((category) => (
                <CategoryTab
                  key={category.id}
                  category={category}
                  isActive={category.id === activeId}
                  layout="desktop"
                  onClick={() => setActiveId(category.id)}
                />
              ))}
            </nav>
          </aside>

          <div className="min-w-0 flex-1">
            {activeCategory && (
              <section className="space-y-5">
                {activeCategory.items.length === 0 ? (
                  <p className="text-muted-foreground">
                    V tejto kategórii zatiaľ nie sú žiadne položky.
                  </p>
                ) : (
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3">
                    {activeCategory.items.map((item) => (
                      <MenuItemCard
                        key={item.id}
                        item={item}
                        currency={currency}
                        onAdd={handleAdd}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      </div>
      <ComboChoiceDialog
        item={comboItem}
        currency={currency}
        onClose={() => setComboItem(null)}
      />
    </>
  );
}
