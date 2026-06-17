"use client";

import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { saveSupplierIngredient } from "@/lib/suppliers/actions";
import { UNIT_LABEL, UNIT_VALUES } from "@/lib/catalog/schemas";
import type { IngredientOption } from "@/lib/catalog/queries";
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

export type PriceListItemValues = {
  id: string;
  ingredientId: string;
  ingredientName: string;
  sku: string;
  packageSize: string;
  packageUnit: string;
  price: string;
  leadTimeDays: string;
  isPreferred: boolean;
};

export function SupplierIngredientDialog({
  supplierId,
  storeId,
  ingredients,
  item,
  trigger,
}: {
  supplierId: string;
  storeId: string;
  ingredients: IngredientOption[];
  item?: PriceListItemValues;
  trigger?: ReactNode;
}) {
  const isEdit = !!item;
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<FormState>(undefined);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await saveSupplierIngredient(undefined, formData);
      setState(result);
      if (result?.ok) {
        toast.success(isEdit ? "Položka cenníka bola uložená." : "Položka bola pridaná.");
        setOpen(false);
      }
    });
  }

  const noIngredients = !isEdit && ingredients.length === 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setState(undefined);
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button disabled={noIngredients}>
            <Plus className="size-4" />
            Pridať položku
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Upraviť položku cenníka" : "Pridať do cenníka"}</DialogTitle>
          <DialogDescription>
            {isEdit ? item.ingredientName : "Surovina, ktorú dodávateľ dodáva, a jej cena/balenie."}
          </DialogDescription>
        </DialogHeader>
        <form key={String(open)} action={onSubmit} className="space-y-4">
          <input type="hidden" name="supplierId" value={supplierId} />
          <input type="hidden" name="storeId" value={storeId} />
          {isEdit && (
            <>
              <input type="hidden" name="id" value={item.id} />
              <input type="hidden" name="ingredientId" value={item.ingredientId} />
            </>
          )}
          <FormMessage message={state?.message} />

          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="ingredientId">Surovina</Label>
              <Select name="ingredientId" defaultValue={state?.values?.ingredientId}>
                <SelectTrigger id="ingredientId" className="w-full">
                  <SelectValue placeholder="Vyber surovinu" />
                </SelectTrigger>
                <SelectContent>
                  {ingredients.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError messages={state?.errors?.ingredientId} />
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="price">Cena za balenie (€)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min={0}
                defaultValue={state?.values?.price ?? item?.price}
              />
              <FieldError messages={state?.errors?.price} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">SKU dodávateľa</Label>
              <Input id="sku" name="sku" defaultValue={state?.values?.sku ?? item?.sku} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="packageSize">Veľkosť balenia</Label>
              <Input
                id="packageSize"
                name="packageSize"
                type="number"
                step="0.001"
                min={0}
                defaultValue={state?.values?.packageSize ?? item?.packageSize}
              />
              <FieldError messages={state?.errors?.packageSize} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="packageUnit">Jednotka balenia</Label>
              <Select
                name="packageUnit"
                defaultValue={state?.values?.packageUnit ?? item?.packageUnit ?? "none"}
              >
                <SelectTrigger id="packageUnit" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {UNIT_VALUES.map((u) => (
                    <SelectItem key={u} value={u}>
                      {UNIT_LABEL[u]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="leadTimeDays">Dodanie (dni)</Label>
              <Input
                id="leadTimeDays"
                name="leadTimeDays"
                type="number"
                min={0}
                defaultValue={state?.values?.leadTimeDays ?? item?.leadTimeDays}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <div>
              <Label htmlFor="isPreferred">Preferovaný dodávateľ</Label>
              <p className="text-xs text-muted-foreground">
                Označ hlavný zdroj tejto suroviny.
              </p>
            </div>
            <Switch id="isPreferred" name="isPreferred" defaultChecked={item?.isPreferred ?? false} />
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
