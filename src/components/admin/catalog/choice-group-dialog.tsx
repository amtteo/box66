"use client";

import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { saveChoiceGroup, deleteChoiceGroup } from "@/lib/choice-groups/actions";
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

export type ChoiceGroupValues = {
  id: string;
  label: string;
  categoryId: string;
  categoryName: string;
  minSelect: number;
  maxSelect: number;
  sortOrder: number;
};

export type ChoicePoolOption = { id: string; name: string };

export function ChoiceGroupDialog({
  productId,
  pools,
  group,
  trigger,
}: {
  productId: string;
  pools: ChoicePoolOption[];
  group?: ChoiceGroupValues;
  trigger?: ReactNode;
}) {
  const isEdit = !!group;
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<FormState>(undefined);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await saveChoiceGroup(undefined, formData);
      setState(result);
      if (result?.ok) {
        toast.success(isEdit ? "Výber bol uložený." : "Výber bol pridaný.");
        setOpen(false);
      }
    });
  }

  const noPools = !isEdit && pools.length === 0;

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
          <Button disabled={noPools}>
            <Plus className="size-4" />
            Pridať výber
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Upraviť výber" : "Pridať výber"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? group.label
              : "Zákazník si pri pridaní do košíka vyberie z kategórie (poolu)."}
          </DialogDescription>
        </DialogHeader>
        <form key={String(open)} action={onSubmit} className="space-y-4">
          {isEdit ? (
            <input type="hidden" name="id" value={group.id} />
          ) : (
            <input type="hidden" name="productId" value={productId} />
          )}
          <FormMessage message={state?.message} />

          <div className="space-y-2">
            <Label htmlFor="label">Názov výberu</Label>
            <Input
              id="label"
              name="label"
              placeholder="napr. Vyber nápoj"
              defaultValue={state?.values?.label ?? group?.label}
              required
            />
            <FieldError messages={state?.errors?.label} />
          </div>

          {isEdit ? (
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
              Pool: <span className="font-medium">{group.categoryName}</span>
              <p className="text-xs text-muted-foreground">
                Kategóriu poolu po vytvorení nemeníme — zmaž a vytvor nový výber.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="categoryId">Pool (kategória na výber)</Label>
              <Select name="categoryId" defaultValue={state?.values?.categoryId}>
                <SelectTrigger id="categoryId" className="w-full">
                  <SelectValue placeholder="Vyber kategóriu" />
                </SelectTrigger>
                <SelectContent>
                  {pools.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError messages={state?.errors?.categoryId} />
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="minSelect">Min.</Label>
              <Input
                id="minSelect"
                name="minSelect"
                type="number"
                min={0}
                defaultValue={state?.values?.minSelect ?? String(group?.minSelect ?? 1)}
              />
              <FieldError messages={state?.errors?.minSelect} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxSelect">Max.</Label>
              <Input
                id="maxSelect"
                name="maxSelect"
                type="number"
                min={1}
                defaultValue={state?.values?.maxSelect ?? String(group?.maxSelect ?? 1)}
              />
              <FieldError messages={state?.errors?.maxSelect} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortOrder">Poradie</Label>
              <Input
                id="sortOrder"
                name="sortOrder"
                type="number"
                min={0}
                defaultValue={state?.values?.sortOrder ?? String(group?.sortOrder ?? 0)}
              />
              <FieldError messages={state?.errors?.sortOrder} />
            </div>
          </div>

          {isEdit && (
            <div className="space-y-2 border-t pt-4">
              <p className="text-xs text-muted-foreground">
                Odstránenie výberu z komba produktu.
              </p>
              <DeleteButton
                variant="inline"
                id={group.id}
                name={group.label}
                action={deleteChoiceGroup}
                description="Výber odstránime z produktu."
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
