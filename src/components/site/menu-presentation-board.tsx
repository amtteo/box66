"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";

import { CategoryTab } from "@/components/storefront/category-tab";
import { MenuProductDetail } from "@/components/site/menu-product-detail";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/orders/types";
import type {
  PresentationCategory,
  PresentationItem,
} from "@/lib/menu/presentation";

function PresentationProductCard({
  item,
  currency,
  isActive,
  isFirst,
  onClick,
  layout,
}: {
  item: PresentationItem;
  currency: string;
  isActive: boolean;
  isFirst: boolean;
  onClick: () => void;
  layout: "list" | "column";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full flex-col overflow-hidden border-y-2 border-t-transparent border-b-transparent text-left transition-colors",
        isActive
          ? cn("border-b-primary", !isFirst && "border-t-primary")
          : undefined,
      )}
    >
      <div className="relative aspect-[4/3] w-full">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes={layout === "column" ? "280px" : "120px"}
            className="object-contain"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ImageIcon className="size-8 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="flex flex-col items-center gap-0.5 px-2 py-2 text-center">
        <span className="line-clamp-2 text-sm font-medium leading-tight">
          {item.name}
        </span>
        <span className="text-sm font-semibold tabular-nums">
          {formatMoney(item.price, currency)}
        </span>
      </div>
    </button>
  );
}

function ProductList({
  items,
  currency,
  selectedSlug,
  onSelect,
  layout,
}: {
  items: PresentationItem[];
  currency: string;
  selectedSlug: string | null;
  onSelect: (item: PresentationItem) => void;
  layout: "list" | "column";
}) {
  if (items.length === 0) {
    return (
      <p className="p-4 text-sm text-muted-foreground">
        V tejto kategórii zatiaľ nie sú žiadne položky.
      </p>
    );
  }

  return (
    <div className="flex flex-col">
      {items.map((item, index) => (
        <PresentationProductCard
          key={item.menuItemId}
          item={item}
          currency={currency}
          isActive={item.slug === selectedSlug}
          isFirst={index === 0}
          onClick={() => onSelect(item)}
          layout={layout}
        />
      ))}
    </div>
  );
}

export function MenuPresentationBoard({
  categories,
  currency,
}: {
  categories: PresentationCategory[];
  currency: string;
}) {
  const [activeCategoryId, setActiveCategoryId] = useState(
    categories[0]?.id ?? "",
  );
  const [selectedProduct, setSelectedProduct] =
    useState<PresentationItem | null>(null);
  const mobileTabRefs = useRef(new Map<string, HTMLButtonElement>());

  const activeCategory =
    categories.find((c) => c.id === activeCategoryId) ?? categories[0];

  useEffect(() => {
    const el = mobileTabRefs.current.get(activeCategoryId);
    el?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeCategoryId]);

  function selectCategory(categoryId: string) {
    setActiveCategoryId(categoryId);
    setSelectedProduct(null);
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
    <div className="mx-auto w-full max-w-6xl">
      {/* Mobile — kategórie hore v slideri */}
      <div className="flex min-h-[calc(100dvh-4rem)] flex-col md:hidden">
        <div className="sticky top-16 z-30 shrink-0 border-b-2 border-primary bg-background">
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
                  isActive={category.id === activeCategoryId}
                  layout="mobile"
                  onClick={() => selectCategory(category.id)}
                />
              </div>
            ))}
          </div>
        </div>

        {activeCategory && (
          <div className="flex min-h-0 flex-1">
            <aside className="flex w-[32%] min-w-[108px] shrink-0 flex-col overflow-y-auto border-r-2 border-primary">
              <ProductList
                items={activeCategory.items}
                currency={currency}
                selectedSlug={selectedProduct?.slug ?? null}
                onSelect={setSelectedProduct}
                layout="list"
              />
            </aside>

            <div className="min-w-0 flex-[0.68] overflow-y-auto">
              {selectedProduct ? (
                <MenuProductDetail
                  product={selectedProduct}
                  categoryName={activeCategory.name}
                  currency={currency}
                  compact
                />
              ) : (
                <div className="flex h-full min-h-[200px] items-center justify-center p-6 text-center text-sm text-muted-foreground">
                  <p>Vyberte produkt vľavo.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Desktop */}
      <div className="hidden min-h-[calc(100dvh-4rem)] md:flex">
        <aside className="w-[148px] shrink-0 border-r-2 border-primary pl-3 lg:w-[160px]">
          <nav className="sticky top-16 flex flex-col gap-1 p-3">
            {categories.map((category) => (
              <CategoryTab
                key={category.id}
                category={category}
                isActive={category.id === activeCategoryId}
                layout="desktop"
                onClick={() => selectCategory(category.id)}
              />
            ))}
          </nav>
        </aside>

        <aside className="w-[240px] shrink-0 overflow-y-auto border-r-2 border-primary lg:w-[280px]">
          {activeCategory && (
            <ProductList
              items={activeCategory.items}
              currency={currency}
              selectedSlug={selectedProduct?.slug ?? null}
              onSelect={setSelectedProduct}
              layout="column"
            />
          )}
        </aside>

        <div className="min-w-0 flex-1 overflow-y-auto">
          {selectedProduct && activeCategory ? (
            <MenuProductDetail
              product={selectedProduct}
              categoryName={activeCategory.name}
              currency={currency}
            />
          ) : (
            <div className="flex h-full min-h-[320px] items-center justify-center p-8 text-center text-muted-foreground">
              <p>Vyberte produkt pre zobrazenie detailu.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
