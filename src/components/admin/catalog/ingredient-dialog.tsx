"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { saveIngredient, deleteIngredient } from "@/lib/catalog/actions";
import {
  UNIT_LABEL,
  UNIT_VALUES,
  type CatalogFormState,
} from "@/lib/catalog/schemas";
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
import { ImageField } from "@/components/admin/catalog/image-field";
import { DeleteButton } from "@/components/admin/catalog/delete-button";

export type { IngredientFormValues } from "@/components/admin/catalog/ingredient-form";
import type { IngredientFormValues } from "@/components/admin/catalog/ingredient-form";

export function IngredientDialog({
  ingredient,
  trigger,
}: {
  ingredient?: IngredientFormValues;
  trigger?: ReactNode;
}) {
  const isEdit = !!ingredient;
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<CatalogFormState, FormData>(
    saveIngredient,
    undefined,
  );

  useEffect(() => {
    if (state?.ok) {
      toast.success(
        isEdit ? "Ingrediencia bola uložená." : "Ingrediencia bola vytvorená.",
      );
      setOpen(false);
    }
  }, [state, isEdit]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="size-4" />
            Nová ingrediencia
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Upraviť ingredienciu" : "Nová ingrediencia"}
          </DialogTitle>
          <DialogDescription>
            Globálna ingrediencia dostupná pre receptúry všetkých franšízantov.
          </DialogDescription>
        </DialogHeader>
        <form key={String(open)} action={formAction} className="space-y-4">
          {isEdit && <input type="hidden" name="id" value={ingredient.id} />}
          <FormMessage message={state?.message} />

          <div className="space-y-2">
            <Label htmlFor="name">Názov</Label>
            <Input
              id="name"
              name="name"
              defaultValue={state?.values?.name ?? ingredient?.name}
              required
            />
            <FieldError messages={state?.errors?.name} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="unit">Merná jednotka</Label>
              <Select
                name="unit"
                defaultValue={state?.values?.unit ?? ingredient?.unit ?? "PCS"}
              >
                <SelectTrigger id="unit" className="w-full">
                  <SelectValue placeholder="Vyber jednotku" />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_VALUES.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {UNIT_LABEL[unit]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError messages={state?.errors?.unit} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU (voliteľné)</Label>
              <Input
                id="sku"
                name="sku"
                defaultValue={state?.values?.sku ?? ingredient?.sku}
              />
              <FieldError messages={state?.errors?.sku} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Poznámka (voliteľné)</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={state?.values?.notes ?? ingredient?.notes}
              rows={2}
            />
            <FieldError messages={state?.errors?.notes} />
          </div>

          <ImageField variant="compact" currentUrl={ingredient?.imageUrl} />

          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <div>
              <Label htmlFor="isActive">Aktívna</Label>
              <p className="text-xs text-muted-foreground">
                Neaktívne ingrediencie sa neponúkajú v receptúrach.
              </p>
            </div>
            <Switch
              id="isActive"
              name="isActive"
              defaultChecked={ingredient?.isActive ?? true}
            />
          </div>

          {isEdit && (
            <div className="space-y-2 border-t pt-4">
              <p className="text-xs text-muted-foreground">
                Natrvalé zmazanie ingrediencie. Ak je v receptúre alebo na sklade,
                zmazanie zlyhá.
              </p>
              <DeleteButton
                variant="inline"
                id={ingredient.id}
                name={ingredient.name}
                action={deleteIngredient}
                description="Ingredienciu natrvalo odstránime z katalógu."
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
