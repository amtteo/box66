"use client";

import { useState } from "react";
import Image from "next/image";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { showCartAddedToast } from "@/components/storefront/cart-added-toast";
import { useCart } from "@/components/storefront/cart-context";
import { ImageIcon, Loader2 } from "lucide-react";
import {
  formatMoney,
  type MenuItemDTO,
  type MenuUpsellDTO,
} from "@/lib/orders/types";

/**
 * Upsell dialóg: single produkt vs. MENU verzia (s nápojom).
 * Pri výbere MENU otvorí rodičovský combo výber.
 */
export function MenuUpsellDialog({
  item,
  currency,
  onClose,
  onChooseMenu,
}: {
  item: MenuItemDTO | null;
  currency: string;
  onClose: () => void;
  onChooseMenu: (menuItem: MenuItemDTO, singleItem: MenuItemDTO) => void;
}) {
  const { add } = useCart();
  const upsell = item?.menuUpsell ?? null;

  function addSingle() {
    if (!item) return;
    add(item);
    showCartAddedToast(item.name);
    onClose();
  }

  function chooseMenu() {
    if (!item || !upsell) return;
    onChooseMenu(menuItemFromUpsell(item, upsell), item);
    onClose();
  }

  const options = item && upsell
    ? [
        {
          key: "single",
          name: item.name,
          price: item.price,
          imageUrl: item.imageUrl,
          onClick: addSingle,
        },
        {
          key: "menu",
          name: upsell.name,
          price: upsell.price,
          imageUrl: upsell.imageUrl,
          onClick: chooseMenu,
        },
      ]
    : [];

  return (
    <Dialog open={!!item && !!upsell} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="p-16 sm:max-w-4xl md:p-36" circleCloseButton>
        <DialogHeader>
          <DialogTitle>{item?.name}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {options.map((option) => (
            <UpsellOptionCard
              key={option.key}
              name={option.name}
              price={option.price}
              currency={currency}
              imageUrl={option.imageUrl}
              onClick={option.onClick}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Zostaví MenuItemDTO pre MENU produkt z upsell dát. */
function menuItemFromUpsell(
  single: MenuItemDTO,
  upsell: MenuUpsellDTO,
): MenuItemDTO {
  return {
    id: upsell.id,
    name: upsell.name,
    description: single.description,
    imageUrl: upsell.imageUrl,
    allergens: single.allergens,
    kcal: single.kcal,
    prepMinutes: single.prepMinutes,
    price: upsell.price,
    categoryId: single.categoryId,
    categoryName: single.categoryName,
    choiceGroups: upsell.choiceGroups,
    menuUpsell: null,
  };
}

function UpsellOptionCard({
  name,
  price,
  currency,
  imageUrl,
  onClick,
}: {
  name: string;
  price: number;
  currency: string;
  imageUrl: string | null;
  onClick: () => void;
}) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[280px] w-full flex-col items-center justify-center gap-4 rounded-xl border-2 border-zinc-200 p-6 text-center transition hover:border-primary focus-visible:border-primary focus-visible:outline-none"
    >
      <div className="relative flex aspect-square w-full max-w-[180px] items-center justify-center overflow-hidden rounded-lg">
        {imageUrl ? (
          <>
            {!isLoaded ? (
              <Loader2 className="size-7 animate-spin text-primary" aria-hidden />
            ) : null}
            <Image
              src={imageUrl}
              alt={name}
              fill
              sizes="180px"
              className={isLoaded ? "object-contain" : "object-contain opacity-0"}
              onLoad={() => setIsLoaded(true)}
            />
          </>
        ) : (
          <ImageIcon className="size-10 text-muted-foreground" aria-hidden />
        )}
      </div>

      <div className="mt-auto flex flex-col items-center justify-center gap-2">
        <p className="text-xl font-semibold leading-tight">{name}</p>
        <span className="font-semibold tabular-nums">
          {formatMoney(price, currency)}
        </span>
      </div>
    </button>
  );
}
