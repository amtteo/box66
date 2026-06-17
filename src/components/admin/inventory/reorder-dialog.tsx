"use client";

import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";

import { setReorderLevel } from "@/lib/inventory/actions";
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

export function ReorderDialog({
  inventoryItemId,
  ingredientName,
  unitLabel,
  reorderLevel,
  trigger,
}: {
  inventoryItemId: string;
  ingredientName: string;
  unitLabel: string;
  reorderLevel: string;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<FormState>(undefined);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await setReorderLevel(undefined, formData);
      setState(result);
      if (result?.ok) {
        toast.success("Hladina doobjednania bola uložená.");
        setOpen(false);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setState(undefined);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Hladina doobjednania</DialogTitle>
          <DialogDescription>{ingredientName}</DialogDescription>
        </DialogHeader>
        <form key={String(open)} action={onSubmit} className="space-y-4">
          <input type="hidden" name="inventoryItemId" value={inventoryItemId} />
          <FormMessage message={state?.message} />
          <div className="space-y-2">
            <Label htmlFor="reorderLevel">
              Minimálna zásoba{unitLabel ? ` (${unitLabel})` : ""}
            </Label>
            <Input
              id="reorderLevel"
              name="reorderLevel"
              type="number"
              step="0.001"
              min={0}
              defaultValue={reorderLevel}
              placeholder="prázdne = bez upozornenia"
            />
            <FieldError messages={state?.errors?.reorderLevel} />
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
