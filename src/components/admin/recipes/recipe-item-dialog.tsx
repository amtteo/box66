"use client";

import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { saveRecipeItem, deleteRecipeItem } from "@/lib/recipes/actions";
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
import { FieldError, FormMessage } from "@/components/admin/form-feedback";
import { DeleteButton } from "@/components/admin/catalog/delete-button";

export type RecipeItemValues = {
  id: string;
  ingredientId: string;
  ingredientName: string;
  quantity: string;
  unit: string;
  notes: string;
};

export function RecipeItemDialog({
  recipeId,
  ingredients,
  item,
  trigger,
}: {
  recipeId: string;
  ingredients: IngredientOption[];
  item?: RecipeItemValues;
  trigger?: ReactNode;
}) {
  const isEdit = !!item;
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<FormState>(undefined);
  const [pending, startTransition] = useTransition();
  const [unit, setUnit] = useState<string>(item?.unit ?? "");

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await saveRecipeItem(undefined, formData);
      setState(result);
      if (result?.ok) {
        toast.success(isEdit ? "Surovina bola uložená." : "Surovina bola pridaná.");
        setOpen(false);
      }
    });
  }

  function onIngredientChange(id: string) {
    const ing = ingredients.find((i) => i.id === id);
    if (ing) setUnit(ing.unit);
  }

  const noIngredients = !isEdit && ingredients.length === 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          setState(undefined);
          setUnit(item?.unit ?? "");
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button disabled={noIngredients}>
            <Plus className="size-4" />
            Pridať surovinu
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Upraviť surovinu" : "Pridať surovinu"}</DialogTitle>
          <DialogDescription>
            {isEdit ? item.ingredientName : "Surovina a jej množstvo na výťažnosť receptúry."}
          </DialogDescription>
        </DialogHeader>
        <form key={String(open)} action={onSubmit} className="space-y-4">
          <input type="hidden" name="recipeId" value={recipeId} />
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
              <Select
                name="ingredientId"
                defaultValue={state?.values?.ingredientId}
                onValueChange={onIngredientChange}
              >
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
              <Label htmlFor="quantity">Množstvo</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                step="0.001"
                min={0}
                defaultValue={state?.values?.quantity ?? item?.quantity}
                required
              />
              <FieldError messages={state?.errors?.quantity} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Jednotka</Label>
              <Select name="unit" value={unit} onValueChange={setUnit}>
                <SelectTrigger id="unit" className="w-full">
                  <SelectValue placeholder="Vyber jednotku" />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_VALUES.map((u) => (
                    <SelectItem key={u} value={u}>
                      {UNIT_LABEL[u]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError messages={state?.errors?.unit} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Poznámka (voliteľné)</Label>
            <Input id="notes" name="notes" defaultValue={state?.values?.notes ?? item?.notes} />
          </div>

          {isEdit && (
            <div className="space-y-2 border-t pt-4">
              <p className="text-xs text-muted-foreground">
                Odstránenie suroviny z tejto receptúry.
              </p>
              <DeleteButton
                variant="inline"
                id={item.id}
                name={item.ingredientName}
                action={deleteRecipeItem}
                description="Surovinu odstránime z receptúry."
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
