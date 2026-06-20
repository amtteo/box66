"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Flame, ImageIcon, Info, Plus, Wheat } from "lucide-react";
import { CategoryTab } from "@/components/storefront/category-tab";
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
import { WelcomePanel } from "@/components/storefront/welcome-panel";

export const WELCOME_CATEGORY_ID = "__welcome__";

const WELCOME_CATEGORY: MenuCategoryDTO = {
  id: WELCOME_CATEGORY_ID,
  name: "Donáška",
  imageUrl: "/couriermoto.webp",
  items: [],
};

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
  showWelcome = false,
  loading = false,
  isAuthed = false,
}: {
  categories: MenuCategoryDTO[];
  currency: string;
  showWelcome?: boolean;
  loading?: boolean;
  isAuthed?: boolean;
}) {
  const displayCategories = showWelcome
    ? [WELCOME_CATEGORY, ...categories]
    : categories;
  const { add } = useCart();
  const [comboItem, setComboItem] = useState<MenuItemDTO | null>(null);
  const [activeId, setActiveId] = useState(displayCategories[0]?.id ?? "");
  const mobileTabRefs = useRef(new Map<string, HTMLButtonElement>());

  const activeCategory =
    displayCategories.find((c) => c.id === activeId) ?? displayCategories[0];
  const isWelcomeActive = activeId === WELCOME_CATEGORY_ID;

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

  if (displayCategories.length === 0) {
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
            {displayCategories.map((category) => (
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

        <div className="flex">
          <aside className="hidden text-white w-[148px] shrink-0 border-r-2 border-primary md:block lg:w-[160px] pl-3">
            <nav className="sticky top-16 flex flex-col gap-1 p-3">
              {displayCategories.map((category) => (
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

          <div className="min-w-0 flex flex-col flex-1">
            {isWelcomeActive ? (
              <WelcomePanel isAuthed={isAuthed} />
            ) : activeCategory ? (
              <section className="space-y-5">
                {loading ? (
                  <p className="p-6 text-muted-foreground">Načítavam menu…</p>
                ) : activeCategory.items.length === 0 ? (
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
            ) : null}
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
