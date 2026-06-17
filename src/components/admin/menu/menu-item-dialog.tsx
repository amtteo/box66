"use client";

import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { addMenuItem, updateMenuItem } from "@/lib/menu/actions";
import type { FormState } from "@/lib/forms";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FieldError, FormMessage } from "@/components/admin/form-feedback";

export type MenuProductOption = {
  id: string;
  name: string;
  categoryName: string;
  suggestedPrice: string;
};

export type MenuItemFormValues = {
  menuItemId: string;
  productName: string;
  price: string;
  isAvailable: boolean;
  sortOrder: number;
};

export function MenuItemDialog({
  storeId,
  currency,
  products,
  item,
  trigger,
}: {
  storeId: string;
  currency: string;
  products?: MenuProductOption[];
  item?: MenuItemFormValues;
  trigger?: ReactNode;
}) {
  const isEdit = !!item;
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<FormState>(undefined);
  const [pending, startTransition] = useTransition();
  const [price, setPrice] = useState(item?.price ?? "");

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = isEdit
        ? await updateMenuItem(undefined, formData)
        : await addMenuItem(undefined, formData);
      setState(result);
      if (result?.ok) {
        toast.success(isEdit ? "Položka menu bola uložená." : "Produkt bol pridaný do menu.");
        setOpen(false);
      }
    });
  }

  function onProductChange(productId: string) {
    const p = products?.find((x) => x.id === productId);
    if (p && p.suggestedPrice) setPrice(p.suggestedPrice);
  }

  const noProducts = !isEdit && (products?.length ?? 0) === 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          setState(undefined);
          setPrice(item?.price ?? "");
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button disabled={noProducts}>
            <Plus className="size-4" />
            Pridať do menu
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Upraviť položku menu" : "Pridať do menu"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? item.productName
              : "Vyber produkt z globálneho katalógu a nastav cenu pre svoju predajňu."}
          </DialogDescription>
        </DialogHeader>
        <form key={String(open)} action={onSubmit} className="space-y-4">
          <input type="hidden" name="storeId" value={storeId} />
          {isEdit && <input type="hidden" name="menuItemId" value={item.menuItemId} />}
          <FormMessage message={state?.message} />

          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="productId">Produkt</Label>
              <Select
                name="productId"
                defaultValue={state?.values?.productId}
                onValueChange={onProductChange}
              >
                <SelectTrigger id="productId" className="w-full">
                  <SelectValue placeholder="Vyber produkt" />
                </SelectTrigger>
                <SelectContent>
                  {products?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} · {p.categoryName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError messages={state?.errors?.productId} />
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="price">Cena ({currency})</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
              <FieldError messages={state?.errors?.price} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortOrder">Poradie</Label>
              <Input
                id="sortOrder"
                name="sortOrder"
                type="number"
                min={0}
                defaultValue={state?.values?.sortOrder ?? String(item?.sortOrder ?? 0)}
              />
              <FieldError messages={state?.errors?.sortOrder} />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <div>
              <Label htmlFor="isAvailable">Dostupné</Label>
              <p className="text-xs text-muted-foreground">
                Nedostupnú položku zákazník v menu nevidí.
              </p>
            </div>
            <Switch id="isAvailable" name="isAvailable" defaultChecked={item?.isAvailable ?? true} />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={pending}>
                Zrušiť
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? "Ukladám…" : "Uložiť"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
