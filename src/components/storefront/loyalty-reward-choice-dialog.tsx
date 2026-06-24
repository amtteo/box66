"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Check, ImageIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { LoyaltyRewardDTO } from "@/lib/loyalty/types";
import type { CartChoice, MenuChoiceOptionDTO } from "@/lib/orders/types";

/** Výber veľkosti / variantu pred pridaním vernostnej odmeny do košíka. */
export function LoyaltyRewardChoiceDialog({
  reward,
  onClose,
  onConfirm,
}: {
  reward: LoyaltyRewardDTO | null;
  onClose: () => void;
  onConfirm: (choices: CartChoice[]) => void;
}) {
  const [selected, setSelected] = useState<Record<string, string[]>>({});

  const rewardKey = reward?.id ?? null;
  const [lastKey, setLastKey] = useState<string | null>(null);
  if (rewardKey !== lastKey) {
    setLastKey(rewardKey);
    setSelected({});
  }

  const groups = useMemo(() => reward?.choiceGroups ?? [], [reward]);

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
    if (!reward) return;
    const choices: CartChoice[] = [];
    for (const g of groups) {
      for (const menuItemId of selected[g.id] ?? []) {
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
    onConfirm(choices);
    onClose();
  }

  return (
    <Dialog open={!!reward} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="z-[60] max-h-[90vh] overflow-y-auto p-8 sm:max-w-lg"
        circleCloseButton
        overlayClassName="z-[60]"
      >
        <DialogHeader>
          <DialogTitle>{reward?.name}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {reward?.pointsCost} bodov · vyber variant
          </p>
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
                        <span className="min-w-0 flex-1 text-lg font-semibold leading-tight">
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
          <Button
            className="h-12 w-full bg-yellow-400 font-bold text-black hover:bg-yellow-500 disabled:bg-zinc-200"
            type="button"
            onClick={confirm}
            disabled={!allValid}
          >
            Pridať odmenu
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
