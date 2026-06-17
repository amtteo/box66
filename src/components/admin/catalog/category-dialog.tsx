"use client";

import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { saveCategory, deleteCategory } from "@/lib/catalog/actions";
import type { CatalogFormState } from "@/lib/catalog/schemas";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { FieldError, FormMessage } from "@/components/admin/form-feedback";
import { ImageField } from "@/components/admin/catalog/image-field";
import { DeleteButton } from "@/components/admin/catalog/delete-button";

export type { CategoryFormValues } from "@/components/admin/catalog/category-form";
import type { CategoryFormValues } from "@/components/admin/catalog/category-form";

export function CategoryDialog({
  category,
  trigger,
}: {
  category?: CategoryFormValues;
  trigger?: ReactNode;
}) {
  const isEdit = !!category;
  const [open, setOpen] = useState(false);
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
        setOpen(false);
      }
    });
  }

  const v = (field: keyof CategoryFormValues) =>
    state?.values?.[field] ?? (category ? String(category[field] ?? "") : "");

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
          <Button>
            <Plus className="size-4" />
            Nová kategória
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Upraviť kategóriu" : "Nová kategória"}</DialogTitle>
          <DialogDescription>
            Kategórie zoskupujú produkty v globálnom katalógu.
          </DialogDescription>
        </DialogHeader>
        <form key={String(open)} action={onSubmit} className="space-y-4">
          {isEdit && <input type="hidden" name="id" value={category.id} />}
          <FormMessage message={state?.message} />

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

          <ImageField variant="compact" currentUrl={category?.imageUrl} />

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
              <Label htmlFor="isChoicePool">Pool výberu (kombo)</Label>
              <p className="text-xs text-muted-foreground">
                {`Z tejto kategórie sa dá vyberať v kombe (napr. „Nápoje k menu“).`}
              </p>
            </div>
            <Switch
              id="isChoicePool"
              name="isChoicePool"
              defaultChecked={category?.isChoicePool ?? false}
            />
          </div>
          <DialogFooter>
          {isEdit && (
              <DeleteButton
                variant="inline"
                id={category.id}
                name={category.name}
                action={deleteCategory}
                disabled={(category.productCount ?? 0) > 0}
                description="Kategóriu natrvalo odstránime z katalógu."
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
