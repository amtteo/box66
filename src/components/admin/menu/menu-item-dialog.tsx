"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { addMenuItem } from "@/lib/menu/actions";
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
};

export function MenuItemDialog({
  storeId,
  products,
}: {
  storeId: string;
  products: MenuProductOption[];
}) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<FormState>(undefined);
  const [pending, startTransition] = useTransition();

  const noProducts = products.length === 0;

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await addMenuItem(undefined, formData);
      setState(result);
      if (result?.ok) {
        toast.success("Produkt bol pridaný do menu predajne.");
        setOpen(false);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setState(undefined);
      }}
    >
      <DialogTrigger asChild>
        <Button disabled={noProducts}>
          <Plus className="size-4" />
          Pridať do menu
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pridať do menu</DialogTitle>
          <DialogDescription>
            Vyber produkt z globálneho katalógu. Cena sa preberie z katalógu a platí
            rovnako pre všetky predajne.
          </DialogDescription>
        </DialogHeader>
        <form key={String(open)} action={onSubmit} className="space-y-4">
          <input type="hidden" name="storeId" value={storeId} />
          <FormMessage message={state?.message} />

          <div className="space-y-2">
            <Label htmlFor="productId">Produkt</Label>
            <Select name="productId" defaultValue={state?.values?.productId}>
              <SelectTrigger id="productId" className="w-full">
                <SelectValue placeholder="Vyber produkt" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} · {p.categoryName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError messages={state?.errors?.productId} />
          </div>

          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <div>
              <Label htmlFor="isAvailable">Dostupné</Label>
              <p className="text-xs text-muted-foreground">
                Predajňa môže dostupnosť neskôr zmeniť podľa zásob.
              </p>
            </div>
            <Switch id="isAvailable" name="isAvailable" defaultChecked />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={pending}>
                Zrušiť
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? "Ukladám…" : "Pridať"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
