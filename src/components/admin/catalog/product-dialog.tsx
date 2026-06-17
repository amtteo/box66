"use client";

import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { saveProduct, deleteProduct } from "@/lib/catalog/actions";
import { ALLERGENS, type CatalogFormState } from "@/lib/catalog/schemas";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

export type { ProductFormValues, CategoryOption } from "@/components/admin/catalog/product-form";
import type {
  ProductFormValues,
  CategoryOption,
} from "@/components/admin/catalog/product-form";

export function ProductDialog({
  product,
  categories,
  trigger,
}: {
  product?: ProductFormValues;
  categories: CategoryOption[];
  trigger?: ReactNode;
}) {
  const isEdit = !!product;
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<CatalogFormState>(undefined);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await saveProduct(undefined, formData);
      setState(result);
      if (result?.ok) {
        toast.success(isEdit ? "Produkt bol uložený." : "Produkt bol vytvorený.");
        setOpen(false);
      }
    });
  }

  const selectedAllergens = new Set(product?.allergens ?? []);
  const noCategories = categories.length === 0;

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
          <Button disabled={noCategories}>
            <Plus className="size-4" />
            Nový produkt
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Upraviť produkt" : "Nový produkt"}</DialogTitle>
          <DialogDescription>
            Globálny produkt, ktorý zdedia všetci franšízanti do svojho menu.
          </DialogDescription>
        </DialogHeader>
        <form key={String(open)} action={onSubmit} className="space-y-4">
          {isEdit && <input type="hidden" name="id" value={product.id} />}
          <FormMessage message={state?.message} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="categoryId">Kategória</Label>
              <Select
                name="categoryId"
                defaultValue={state?.values?.categoryId ?? product?.categoryId}
              >
                <SelectTrigger id="categoryId" className="w-full">
                  <SelectValue placeholder="Vyber kategóriu" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError messages={state?.errors?.categoryId} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Názov</Label>
              <Input
                id="name"
                name="name"
                defaultValue={state?.values?.name ?? product?.name}
                required
              />
              <FieldError messages={state?.errors?.name} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug (voliteľné)</Label>
            <Input
              id="slug"
              name="slug"
              defaultValue={state?.values?.slug ?? product?.slug}
              placeholder="vygeneruje sa z názvu"
            />
            <FieldError messages={state?.errors?.slug} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Popis (voliteľné)</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={state?.values?.description ?? product?.description}
              rows={3}
            />
            <FieldError messages={state?.errors?.description} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="suggestedPrice">Navrhovaná cena (€)</Label>
              <Input
                id="suggestedPrice"
                name="suggestedPrice"
                type="number"
                step="0.01"
                min={0}
                defaultValue={state?.values?.suggestedPrice ?? product?.suggestedPrice}
              />
              <FieldError messages={state?.errors?.suggestedPrice} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kcal">Kalórie (kcal)</Label>
              <Input
                id="kcal"
                name="kcal"
                type="number"
                min={0}
                defaultValue={state?.values?.kcal ?? product?.kcal}
              />
              <FieldError messages={state?.errors?.kcal} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prepMinutes">Príprava (min)</Label>
              <Input
                id="prepMinutes"
                name="prepMinutes"
                type="number"
                min={0}
                defaultValue={state?.values?.prepMinutes ?? product?.prepMinutes}
              />
              <FieldError messages={state?.errors?.prepMinutes} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU (voliteľné)</Label>
              <Input
                id="sku"
                name="sku"
                defaultValue={state?.values?.sku ?? product?.sku}
              />
              <FieldError messages={state?.errors?.sku} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortOrder">Poradie</Label>
              <Input
                id="sortOrder"
                name="sortOrder"
                type="number"
                min={0}
                defaultValue={state?.values?.sortOrder ?? String(product?.sortOrder ?? 0)}
              />
              <FieldError messages={state?.errors?.sortOrder} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Alergény</Label>
            <div className="grid grid-cols-2 gap-2 rounded-md border p-3 sm:grid-cols-3">
              {ALLERGENS.map((allergen) => (
                <label
                  key={allergen.code}
                  className="flex items-center gap-2 text-sm"
                >
                  <Checkbox
                    name="allergens"
                    value={allergen.code}
                    defaultChecked={selectedAllergens.has(allergen.code)}
                  />
                  {allergen.label}
                </label>
              ))}
            </div>
          </div>

          <ImageField variant="compact" currentUrl={product?.imageUrl} />

          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <div>
              <Label htmlFor="isActive">Aktívny</Label>
              <p className="text-xs text-muted-foreground">
                Neaktívne produkty sa nedajú zapnúť do menu predajne.
              </p>
            </div>
            <Switch
              id="isActive"
              name="isActive"
              defaultChecked={product?.isActive ?? true}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <div>
              <Label htmlFor="isComboOption">Možnosť v kombe</Label>
              <p className="text-xs text-muted-foreground">
                Smie sa ponúkať ako voľba v kombe (napr. konkrétny nápoj).
              </p>
            </div>
            <Switch
              id="isComboOption"
              name="isComboOption"
              defaultChecked={product?.isComboOption ?? false}
            />
          </div>

          <DialogFooter>
          {isEdit && (
              <DeleteButton
                variant="inline"
                id={product.id}
                name={product.name}
                action={deleteProduct}
                description="Produkt natrvalo odstránime z katalógu vrátane receptúry."
                onDeleted={() => setOpen(false)}
              />
          )}
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
