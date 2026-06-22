"use client";

import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { savePriceCoefficient } from "@/lib/pricing/actions";
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
import { FieldError, FormMessage } from "@/components/admin/form-feedback";

export type CoefficientFormValues = {
  id: string;
  name: string;
  multiplier: string;
  sortOrder: number;
};

export function CoefficientDialog({
  coefficient,
  trigger,
}: {
  coefficient?: CoefficientFormValues;
  trigger?: ReactNode;
}) {
  const isEdit = !!coefficient;
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<FormState>(undefined);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await savePriceCoefficient(undefined, formData);
      setState(result);
      if (result?.ok) {
        toast.success(isEdit ? "Koeficient bol uložený." : "Koeficient bol vytvorený.");
        setOpen(false);
      }
    });
  }

  const v = (k: keyof CoefficientFormValues) =>
    state?.values?.[k] ?? (coefficient ? String(coefficient[k] ?? "") : "");

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
            Nový koeficient
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Upraviť koeficient" : "Nový koeficient"}</DialogTitle>
          <DialogDescription>
            Násobí základnú cenu z katalógu pre predajne s týmto koeficientom.
          </DialogDescription>
        </DialogHeader>
        <form key={String(open)} action={onSubmit} className="space-y-4">
          {isEdit && <input type="hidden" name="id" value={coefficient.id} />}
          <FormMessage message={state?.message} />

          <div className="space-y-2">
            <Label htmlFor="name">Názov</Label>
            <Input id="name" name="name" defaultValue={v("name")} required />
            <FieldError messages={state?.errors?.name} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="multiplier">Koeficient</Label>
              <Input
                id="multiplier"
                name="multiplier"
                type="number"
                step="0.0001"
                min={0.01}
                defaultValue={v("multiplier") || "1"}
                required
              />
              <FieldError messages={state?.errors?.multiplier} />
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
