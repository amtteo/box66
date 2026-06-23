"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

import { setMenuItemCustomPrice } from "@/lib/pricing/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatMoney } from "@/lib/orders/types";
import { cn } from "@/lib/utils";

type Props = {
  menuItemId: string;
  effectivePrice: number | null;
  customPrice: string | null;
  currency?: string;
};

export function MenuPriceEditor({
  menuItemId,
  effectivePrice,
  customPrice,
  currency = "EUR",
}: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(customPrice ?? "");

  function submit(custom: string | null) {
    const formData = new FormData();
    formData.set("menuItemId", menuItemId);
    if (custom != null && custom.trim() !== "") {
      formData.set("customPrice", custom);
    }
    startTransition(async () => {
      const result = await setMenuItemCustomPrice(undefined, formData);
      if (result?.ok) {
        toast.success(custom ? "Vlastná cena bola uložená." : "Používa sa vypočítaná cena.");
        setOpen(false);
      } else {
        toast.error(result?.message ?? "Cenu sa nepodarilo uložiť.");
      }
    });
  }

  if (effectivePrice == null) {
    return (
      <p className="border-t px-2.5 py-2 text-xs text-muted-foreground">
        Vernostná odmena
      </p>
    );
  }

  const isOverride = customPrice != null && customPrice !== "";

  return (
    <div className="flex items-center justify-between gap-2 border-t px-2.5 py-2">
      <div className="min-w-0">
        <p className="text-sm font-medium tabular-nums">
          {formatMoney(effectivePrice, currency)}
        </p>
        {isOverride && (
          <p className="text-[10px] text-muted-foreground">vlastná cena</p>
        )}
      </div>
      <Popover
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (o) setValue(customPrice ?? String(effectivePrice));
        }}
      >
        <PopoverTrigger asChild>
          <Button type="button" variant="ghost" size="icon-sm" className="shrink-0">
            <Pencil className="size-3.5" />
            <span className="sr-only">Upraviť cenu</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-56 space-y-3">
          <div className="space-y-2">
            <Label htmlFor={`price-${menuItemId}`}>Vlastná cena (€)</Label>
            <Input
              id={`price-${menuItemId}`}
              type="number"
              step="0.01"
              min={0}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={pending}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              size="sm"
              disabled={pending}
              onClick={() => submit(value)}
            >
              {pending ? "Ukladám…" : "Uložiť"}
            </Button>
            {isOverride && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pending}
                className={cn()}
                onClick={() => submit(null)}
              >
                Použiť vypočítanú cenu
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
