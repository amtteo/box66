"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { saveCategory, deleteCategory } from "@/lib/catalog/actions";
import type { CatalogFormState } from "@/lib/catalog/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { FieldError, FormMessage } from "@/components/admin/form-feedback";
import { CatalogIdentityFields, ImageField } from "@/components/admin/catalog/image-field";
import { DeleteButton } from "@/components/admin/catalog/delete-button";
import { useCatalogPanel } from "@/components/admin/catalog/use-catalog-panel";

export type CategoryFormValues = {
  id: string;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  isChoicePool: boolean;
  showInStorefront: boolean;
  imageUrl: string | null;
  productCount?: number;
};

export function CategoryForm({ category }: { category?: CategoryFormValues }) {
  const isEdit = !!category;
  const router = useRouter();
  const { closePanel } = useCatalogPanel();
  const [state, setState] = useState<CatalogFormState>(undefined);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await saveCategory(undefined, formData);
      setState(result);
      if (result?.ok) {
        toast.success(
          isEdit ? "Kategória bola uložená." : "Kategória bola vytvorená.",
        );
        router.refresh();
        closePanel();
      }
    });
  }

  const v = (field: keyof CategoryFormValues) =>
    state?.values?.[field] ?? (category ? String(category[field] ?? "") : "");

  return (
    <form action={onSubmit} className="space-y-4">
      {isEdit && <input type="hidden" name="id" value={category.id} />}
      <FormMessage message={state?.message} />

      <CatalogIdentityFields image={<ImageField currentUrl={category?.imageUrl} />}>
        <div className="space-y-2">
          <Label htmlFor="name">Názov</Label>
          <Input id="name" name="name" defaultValue={v("name")} required />
          <FieldError messages={state?.errors?.name} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug (voliteľné)</Label>
          <Input
            id="slug"
            name="slug"
            defaultValue={v("slug")}
            placeholder="vygeneruje sa z názvu"
          />
          <FieldError messages={state?.errors?.slug} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Popis (voliteľné)</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={v("description")}
            rows={3}
          />
          <FieldError messages={state?.errors?.description} />
        </div>
      </CatalogIdentityFields>

      <div className="space-y-2">
        <Label htmlFor="sortOrder">Poradie</Label>
        <Input
          id="sortOrder"
          name="sortOrder"
          type="number"
          min={0}
          defaultValue={state?.values?.sortOrder ?? String(category?.sortOrder ?? 0)}
        />
        <FieldError messages={state?.errors?.sortOrder} />
      </div>

      <div className="flex items-center justify-between rounded-md border px-3 py-2">
        <div>
          <Label htmlFor="isActive">Aktívna</Label>
          <p className="text-xs text-muted-foreground">
            Neaktívne kategórie sa nezobrazia v ponuke.
          </p>
        </div>
        <Switch
          id="isActive"
          name="isActive"
          defaultChecked={category?.isActive ?? true}
        />
      </div>

      <div className="flex items-center justify-between rounded-md border px-3 py-2">
        <div>
          <Label htmlFor="showInStorefront">Nákupné menu (objednávka)</Label>
          <p className="text-xs text-muted-foreground">
            Vypni pre kategórie iba na odmeny (napr. MERCH). Na prezentačnom
            menu (/menu) zostanú viditeľné.
          </p>
        </div>
        <Switch
          id="showInStorefront"
          name="showInStorefront"
          defaultChecked={category?.showInStorefront ?? true}
        />
      </div>

      <div className="flex items-center justify-between rounded-md border px-3 py-2">
        <div>
          <Label htmlFor="isChoicePool">Pool výberu (kombo)</Label>
          <p className="text-xs text-muted-foreground">
            Z tejto kategórie sa dá vyberať v kombe (napr. „Nápoje k menu“).
          </p>
        </div>
        <Switch
          id="isChoicePool"
          name="isChoicePool"
          defaultChecked={category?.isChoicePool ?? false}
        />
      </div>

      <div className="flex justify-end gap-2 border-t pt-4">
      {isEdit && (
          <DeleteButton
            variant="inline"
            id={category.id}
            name={category.name}
            action={deleteCategory}
            disabled={(category.productCount ?? 0) > 0}
            description="Kategóriu natrvalo odstránime z katalógu."
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
