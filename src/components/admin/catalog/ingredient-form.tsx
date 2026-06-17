"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { saveIngredient, deleteIngredient } from "@/lib/catalog/actions";
import {
  UNIT_LABEL,
  UNIT_VALUES,
  type CatalogFormState,
} from "@/lib/catalog/schemas";
import { Button } from "@/components/ui/button";
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
import { CatalogIdentityFields, ImageField } from "@/components/admin/catalog/image-field";
import { DeleteButton } from "@/components/admin/catalog/delete-button";
import { useCatalogPanel } from "@/components/admin/catalog/use-catalog-panel";

export type IngredientFormValues = {
  id: string;
  name: string;
  sku: string;
  unit: string;
  notes: string;
  isActive: boolean;
  imageUrl: string | null;
};

export function IngredientForm({ ingredient }: { ingredient?: IngredientFormValues }) {
  const isEdit = !!ingredient;
  const router = useRouter();
  const { closePanel } = useCatalogPanel();
  const [state, formAction, pending] = useActionState<CatalogFormState, FormData>(
    saveIngredient,
    undefined,
  );

  useEffect(() => {
    if (state?.ok) {
      toast.success(
        isEdit ? "Ingrediencia bola uložená." : "Ingrediencia bola vytvorená.",
      );
      router.refresh();
      closePanel();
    }
  }, [state, isEdit, router, closePanel]);

  return (
    <form action={formAction} className="space-y-4">
      {isEdit && <input type="hidden" name="id" value={ingredient.id} />}
      <FormMessage message={state?.message} />

      <CatalogIdentityFields image={<ImageField currentUrl={ingredient?.imageUrl} />}>
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
            rows={3}
          />
          <FieldError messages={state?.errors?.notes} />
        </div>
      </CatalogIdentityFields>

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

      <div className="flex justify-end gap-2 border-t pt-4">
        {isEdit && (
          <DeleteButton
            variant="inline"
            id={ingredient.id}
            name={ingredient.name}
            action={deleteIngredient}
            description="Ingredienciu natrvalo odstránime z katalógu."
            onDeleted={() => {
              router.refresh();
              closePanel();
            }}
          />
        )}

        <Button
          className="ml-auto"
          type="button"
          variant="outline"
          disabled={pending}
          onClick={closePanel}
        >
          Zrušiť
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Ukladám…" : "Uložiť"}
        </Button>
      </div>
    </form>
  );
}
