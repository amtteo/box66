"use client";

import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { saveLoyaltyReward } from "@/lib/loyalty/actions";
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

export type LoyaltyProductOption = {
  id: string;
  name: string;
  categoryName: string;
};

export type RewardFormValues = {
  id: string;
  productId: string;
  pointsCost: number;
  sortOrder: number;
  isActive: boolean;
};

export function RewardDialog({
  reward,
  products,
  trigger,
}: {
  reward?: RewardFormValues;
  products: LoyaltyProductOption[];
  trigger?: ReactNode;
}) {
  const isEdit = !!reward;
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<FormState>(undefined);
  const [pending, startTransition] = useTransition();
  const [productId, setProductId] = useState(reward?.productId ?? "");

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await saveLoyaltyReward(undefined, formData);
      setState(result);
      if (result?.ok) {
        toast.success(isEdit ? "Odmena bola uložená." : "Odmena bola vytvorená.");
        setOpen(false);
      }
    });
  }

  const v = (k: keyof RewardFormValues) =>
    state?.values?.[k] ?? (reward ? String(reward[k] ?? "") : "");

  const noProducts = products.length === 0 && !isEdit;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          setState(undefined);
          setProductId(reward?.productId ?? "");
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button disabled={noProducts}>
            <Plus className="size-4" />
            Nová odmena
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Upraviť odmenu" : "Nová odmena"}</DialogTitle>
          <DialogDescription>
            Produkt z katalógu (bez komba). Zákazník ho uplatní za body v košíku.
          </DialogDescription>
        </DialogHeader>
        <form key={String(open)} action={onSubmit} className="space-y-4">
          {isEdit && <input type="hidden" name="id" value={reward.id} />}
          <input type="hidden" name="productId" value={productId} />
          <FormMessage message={state?.message} />

          <div className="space-y-2">
            <Label htmlFor="reward-product">Produkt</Label>
            <Select
              value={productId || undefined}
              onValueChange={setProductId}
              disabled={isEdit}
              required
            >
              <SelectTrigger id="reward-product">
                <SelectValue placeholder="Vyber produkt…" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                    <span className="text-muted-foreground"> · {p.categoryName}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError messages={state?.errors?.productId} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pointsCost">Cena v bodoch</Label>
              <Input
                id="pointsCost"
                name="pointsCost"
                type="number"
                min={1}
                step={1}
                defaultValue={v("pointsCost") || "50"}
                required
              />
              <FieldError messages={state?.errors?.pointsCost} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortOrder">Poradie</Label>
              <Input
                id="sortOrder"
                name="sortOrder"
                type="number"
                min={0}
                defaultValue={v("sortOrder") || "0"}
              />
              <FieldError messages={state?.errors?.sortOrder} />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="isActive">Aktívna</Label>
              <p className="text-xs text-muted-foreground">
                Neaktívne odmeny sa zákazníkom nezobrazujú.
              </p>
            </div>
            <Switch
              id="isActive"
              name="isActive"
              defaultChecked={reward?.isActive ?? true}
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={pending}>
                Zrušiť
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending || !productId}>
              {pending ? "Ukladám…" : "Uložiť"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
