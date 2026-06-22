"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ArrowLeft, Check, ImageIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { showCartAddedToast } from "@/components/storefront/cart-added-toast";
import { useCart } from "@/components/storefront/cart-context";
import { cn } from "@/lib/utils";
import { type CartChoice, type MenuChoiceOptionDTO, type MenuItemDTO } from "@/lib/orders/types";

/**
 * Modal výberu pre kombo (napr. nápoj k menu). Otvorí sa pri pridávaní položky,
 * ktorá má aspoň jednu skupinu výberu. Po potvrdení pridá riadok do košíka.
 */
export function ComboChoiceDialog({
  item,
  currency,
  onClose,
  onBack,
}: {
  item: MenuItemDTO | null;
  currency: string;
  onClose: () => void;
  onBack?: () => void;
}) {
  const { add } = useCart();
  // Mapa groupId -> zoznam vybraných menuItemId.
  const [selected, setSelected] = useState<Record<string, string[]>>({});

  // Reset výberu pri zmene položky.
  const itemKey = item?.id ?? null;
  const [lastKey, setLastKey] = useState<string | null>(null);
  if (itemKey !== lastKey) {
    setLastKey(itemKey);
    setSelected({});
  }

  const groups = useMemo(() => item?.choiceGroups ?? [], [item]);

  const allValid = useMemo(
    () =>
      groups.every((g) => {
        const count = selected[g.id]?.length ?? 0;
        return count >= g.minSelect && count <= g.maxSelect;
      }),
    [groups, selected],
  );

  function toggle(groupId: string, maxSelect: number, menuItemId: string) {
    setSelected((prev) => {
      const current = prev[groupId] ?? [];
      const isSelected = current.includes(menuItemId);

      if (maxSelect === 1) {
        return { ...prev, [groupId]: isSelected ? [] : [menuItemId] };
      }
      if (isSelected) {
        return { ...prev, [groupId]: current.filter((id) => id !== menuItemId) };
      }
      if (current.length >= maxSelect) return prev;
      return { ...prev, [groupId]: [...current, menuItemId] };
    });
  }

  function confirm() {
    if (!item) return;
    const choices: CartChoice[] = [];
    for (const g of groups) {
      const chosen = selected[g.id] ?? [];
      for (const menuItemId of chosen) {
        const opt = g.options.find((o) => o.menuItemId === menuItemId);
        if (!opt) continue;
        choices.push({
          groupId: g.id,
          groupLabel: g.label,
          menuItemId: opt.menuItemId,
          productId: opt.productId,
          name: opt.name,
        });
      }
    }
    add(item, choices);
    showCartAddedToast(item.name);
    onClose();
  }

  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto p-16 sm:max-w-4xl md:p-36"
        circleCloseButton
      >
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="absolute top-4 left-4 flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-foreground bg-background outline-none transition-colors hover:bg-accent focus:outline-none focus-visible:outline-none focus-visible:ring-0"
          >
            <ArrowLeft className="size-5" />
            <span className="sr-only">Späť</span>
          </button>
        ) : null}

        <DialogHeader>
          <DialogTitle>{item?.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {groups.map((g) => {
            const count = selected[g.id]?.length ?? 0;
            const hint =
              g.maxSelect === 1
                ? "Vyber 1"
                : `Vyber ${g.minSelect}–${g.maxSelect}`;
            const invalid = count < g.minSelect || count > g.maxSelect;
            return (
              <fieldset key={g.id} className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <legend className="text-sm font-medium">{g.label}</legend>
                  <span
                    className={
                      invalid
                        ? "text-xs text-muted-foreground"
                        : "text-xs text-muted-foreground"
                    }
                  >
                    {hint}
                  </span>
                </div>
                <div className="space-y-2">
                  {g.options.map((opt) => {
                    const checked = (selected[g.id] ?? []).includes(
                      opt.menuItemId,
                    );
                    return (
                      <button
                        key={opt.menuItemId}
                        type="button"
                        onClick={() => toggle(g.id, g.maxSelect, opt.menuItemId)}
                        aria-pressed={checked}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg border-2 p-3 text-left transition",
                          checked
                            ? "border-primary"
                            : "border-zinc-200 hover:border-zinc-900",
                        )}
                      >
                        <ChoiceOptionThumb option={opt} />
                        <span className="min-w-0 flex-1 text-xl font-semibold leading-tight">
                          {opt.name}
                        </span>
                        {checked ? (
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-green-500">
                            <Check className="size-4 text-white" strokeWidth={3} />
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}
        </div>

        <DialogFooter>
          <Button className="h-14 px-6 bg-yellow-400 text-black font-bold hover:bg-yellow-500 text-lg disabled:bg-zinc-200" type="button" onClick={confirm} disabled={!allValid}>
            Pridať do košíka
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ChoiceOptionThumb({ option }: { option: MenuChoiceOptionDTO }) {
  return (
    <div className="relative size-12 shrink-0 overflow-hidden rounded-md">
      {option.imageUrl ? (
        <Image
          src={option.imageUrl}
          alt={option.name}
          fill
          sizes="48px"
          className="object-contain"
        />
      ) : (
        <div className="flex size-full items-center justify-center">
          <ImageIcon className="size-5 text-muted-foreground" aria-hidden />
        </div>
      )}
    </div>
  );
}
