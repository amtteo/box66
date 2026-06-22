"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { saveProduct, deleteProduct } from "@/lib/catalog/actions";
import { ALLERGENS, type CatalogFormState } from "@/lib/catalog/schemas";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

export type ProductFormValues = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  basePrice: string;
  sku: string;
  allergens: string[];
  kcal: string;
  prepMinutes: string;
  sortOrder: number;
  isActive: boolean;
  isComboOption: boolean;
  menuUpsellProductId: string | null;
  imageUrl: string | null;
};

export type CategoryOption = { id: string; name: string };

export type MenuUpsellOption = {
  id: string;
  name: string;
  categoryName: string;
};

export function ProductForm({
  product,
  categories,
  menuUpsellOptions = [],
}: {
  product?: ProductFormValues;
  categories: CategoryOption[];
  menuUpsellOptions?: MenuUpsellOption[];
}) {
  const isEdit = !!product;
  const router = useRouter();
  const { closePanel } = useCatalogPanel();
  const [state, setState] = useState<CatalogFormState>(undefined);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await saveProduct(undefined, formData);
      setState(result);
      if (result?.ok) {
        toast.success(isEdit ? "Produkt bol uložený." : "Produkt bol vytvorený.");
        router.refresh();
        closePanel();
      }
    });
  }

  const selectedAllergens = new Set(product?.allergens ?? []);

  return (
    <form action={onSubmit} className="space-y-4">
      {isEdit && <input type="hidden" name="id" value={product.id} />}
      <FormMessage message={state?.message} />

      <CatalogIdentityFields image={<ImageField currentUrl={product?.imageUrl} />}>
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
        <div className="grid gap-4 grid-cols-2">
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
          <Label htmlFor="basePrice">Základná cena (€)</Label>
          <Input
            id="basePrice"
            name="basePrice"
            type="number"
            step="0.01"
            min={0}
            defaultValue={state?.values?.basePrice ?? product?.basePrice}
          />
          <FieldError messages={state?.errors?.basePrice} />
        </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            name="slug"
            defaultValue={state?.values?.slug ?? product?.slug}
            placeholder="vygeneruje sa z názvu"
          />
          <FieldError messages={state?.errors?.slug} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Popis</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={state?.values?.description ?? product?.description}
            rows={5}
          />
          <FieldError messages={state?.errors?.description} />
        </div>
      </CatalogIdentityFields>

      <div className="grid gap-4 sm:grid-cols-4">
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
        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
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
        <div className="grid grid-cols-2 gap-2 rounded-md border p-3">
          {ALLERGENS.map((allergen, index) => (
            <label key={allergen.code} className="flex items-center gap-2 text-sm">
              <Checkbox
                name="allergens"
                value={allergen.code}
                defaultChecked={selectedAllergens.has(allergen.code)}
              />
              <span className="tabular-nums text-muted-foreground">{index + 1}.</span>
              {allergen.label}
            </label>
          ))}
        </div>
      </div>

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

      <div className="space-y-2 rounded-md border px-3 py-3">
        <Label htmlFor="menuUpsellProductId">MENU upsell</Label>
        <p className="text-xs text-muted-foreground">
          Pri pridaní single produktu do košíka ponúknuť aj MENU verziu (s výberom nápoja).
        </p>
        <Select
          name="menuUpsellProductId"
          defaultValue={
            state?.values?.menuUpsellProductId ??
            product?.menuUpsellProductId ??
            "__none__"
          }
        >
          <SelectTrigger id="menuUpsellProductId" className="w-full">
            <SelectValue placeholder="Bez upsellu" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Bez upsellu</SelectItem>
            {menuUpsellOptions.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {`${p.name} · ${p.categoryName}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError messages={state?.errors?.menuUpsellProductId} />
      </div>

      <div className="flex justify-end gap-2 border-t pt-4">
      {isEdit && (
          <DeleteButton
            variant="inline"
            id={product.id}
            name={product.name}
            action={deleteProduct}
            description="Produkt natrvalo odstránime z katalógu vrátane receptúry."
            onDeleted={() => {
              router.refresh();
              closePanel();
            }}
          />
      )}

        <Button className="ml-auto" type="button" variant="outline" disabled={pending} onClick={closePanel}>
          Zrušiť
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Ukladám…" : "Uložiť"}
        </Button>
      </div>
    </form>
  );
}
