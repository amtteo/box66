"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCart } from "@/components/storefront/cart-context";
import { formatMoney, type CartChoice, type MenuItemDTO } from "@/lib/orders/types";

/**
 * Modal výberu pre kombo (napr. nápoj k menu). Otvorí sa pri pridávaní položky,
 * ktorá má aspoň jednu skupinu výberu. Po potvrdení pridá riadok do košíka.
 */
export function ComboChoiceDialog({
  item,
  currency,
  onClose,
}: {
  item: MenuItemDTO | null;
  currency: string;
  onClose: () => void;
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
    toast.success(`„${item.name}" pridané do košíka.`);
    onClose();
  }

  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{item?.name}</DialogTitle>
          <DialogDescription>
            {item ? formatMoney(item.price, currency) : ""} — dokonči svoj výber.
          </DialogDescription>
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
                        className={`flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left transition ${
                          checked
                            ? "border-primary ring-1 ring-primary"
                            : "hover:bg-accent"
                        }`}
                      >
                        <span className="font-medium">{opt.name}</span>
                        {checked && <Check className="size-4 text-primary" />}
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
            variant="outline"
            type="button"
            onClick={onClose}
          >
            Zrušiť
          </Button>
          <Button type="button" onClick={confirm} disabled={!allValid}>
            Pridať do košíka
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
