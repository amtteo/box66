"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { saveRecipe, deleteRecipe } from "@/lib/recipes/actions";
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
import { Textarea } from "@/components/ui/textarea";
import { FieldError, FormMessage } from "@/components/admin/form-feedback";
import { DeleteButton } from "@/components/admin/catalog/delete-button";

export type RecipeProductOption = { id: string; name: string; categoryName: string };

export type RecipeFormValues = {
  id: string;
  name: string;
  yield: number;
  instructions: string;
  isActive: boolean;
};

export function RecipeDialog({
  products,
  productId,
  productName,
  recipe,
  trigger,
}: {
  products?: RecipeProductOption[];
  productId?: string;
  productName?: string;
  recipe?: RecipeFormValues;
  trigger?: ReactNode;
}) {
  const isEdit = !!recipe;
  const isFixedProduct = !isEdit && !!productId;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<FormState>(undefined);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await saveRecipe(undefined, formData);
      setState(result);
      if (result?.ok) {
        toast.success(isEdit ? "Receptúra bola uložená." : "Receptúra bola vytvorená.");
        router.refresh();
        setOpen(false);
      }
    });
  }

  const noProducts = !isEdit && !isFixedProduct && (products?.length ?? 0) === 0;

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
          <Button disabled={noProducts}>
            <Plus className="size-4" />
            Nová receptúra
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? "Upraviť receptúru"
              : isFixedProduct
                ? `Nová receptúra — ${productName}`
                : "Nová receptúra"}
          </DialogTitle>
          <DialogDescription>
            Globálna receptúra produktu — zdedia ju všetky predajne. Odpočet skladu
            pri objednávke vychádza výhradne z nej.
          </DialogDescription>
        </DialogHeader>
        <form key={String(open)} action={onSubmit} className="space-y-4">
          {isEdit && <input type="hidden" name="id" value={recipe.id} />}
          <FormMessage message={state?.message} />

          {!isEdit && isFixedProduct && (
            <input type="hidden" name="productId" value={productId} />
          )}

          {!isEdit && !isFixedProduct && (
            <div className="space-y-2">
              <Label htmlFor="productId">Produkt</Label>
              <Select name="productId" defaultValue={state?.values?.productId}>
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
              <Label htmlFor="name">Názov (voliteľné)</Label>
              <Input
                id="name"
                name="name"
                defaultValue={state?.values?.name ?? recipe?.name}
                placeholder="napr. Základná receptúra"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="yield">Výťažnosť (porcie)</Label>
              <Input
                id="yield"
                name="yield"
                type="number"
                min={1}
                defaultValue={state?.values?.yield ?? String(recipe?.yield ?? 1)}
              />
              <FieldError messages={state?.errors?.yield} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">Postup (voliteľné)</Label>
            <Textarea
              id="instructions"
              name="instructions"
              rows={3}
              defaultValue={state?.values?.instructions ?? recipe?.instructions}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <div>
              <Label htmlFor="isActive">Aktívna</Label>
              <p className="text-xs text-muted-foreground">
                Len aktívna receptúra sa použije na odpočet skladu.
              </p>
            </div>
            <Switch id="isActive" name="isActive" defaultChecked={recipe?.isActive ?? true} />
          </div>

          {isEdit && (
            <div className="space-y-2 border-t pt-4">
              <p className="text-xs text-muted-foreground">
                Natrvalé zmazanie receptúry vrátane všetkých surovín.
              </p>
              <DeleteButton
                variant="inline"
                id={recipe.id}
                name={productName ?? "receptúru"}
                action={deleteRecipe}
                description="Receptúru natrvalo odstránime aj s jej surovinami."
                onDeleted={() => setOpen(false)}
              />
            </div>
          )}

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
