"use client";

import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { saveSupplier } from "@/lib/suppliers/actions";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { FieldError, FormMessage } from "@/components/admin/form-feedback";

export type SupplierFormValues = {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  ico: string;
  dic: string;
  notes: string;
  isActive: boolean;
};

export function SupplierDialog({
  supplier,
  trigger,
}: {
  supplier?: SupplierFormValues;
  trigger?: ReactNode;
}) {
  const isEdit = !!supplier;
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<FormState>(undefined);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await saveSupplier(undefined, formData);
      setState(result);
      if (result?.ok) {
        toast.success(isEdit ? "Dodávateľ bol uložený." : "Dodávateľ bol vytvorený.");
        setOpen(false);
      }
    });
  }

  const v = (k: keyof SupplierFormValues) =>
    state?.values?.[k] ?? (supplier ? String(supplier[k] ?? "") : "");

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
            Nový dodávateľ
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Upraviť dodávateľa" : "Nový dodávateľ"}</DialogTitle>
          <DialogDescription>
            Dodávateľ surovín tvojej organizácie. Cenník nastavíš v detaile dodávateľa.
          </DialogDescription>
        </DialogHeader>
        <form key={String(open)} action={onSubmit} className="space-y-4">
          {isEdit && <input type="hidden" name="id" value={supplier.id} />}
          <FormMessage message={state?.message} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Názov</Label>
              <Input id="name" name="name" defaultValue={v("name")} required />
              <FieldError messages={state?.errors?.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactName">Kontaktná osoba</Label>
              <Input id="contactName" name="contactName" defaultValue={v("contactName")} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" defaultValue={v("email")} />
              <FieldError messages={state?.errors?.email} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefón</Label>
              <Input id="phone" name="phone" defaultValue={v("phone")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Adresa</Label>
            <Input id="address" name="address" defaultValue={v("address")} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ico">IČO</Label>
              <Input id="ico" name="ico" defaultValue={v("ico")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dic">DIČ</Label>
              <Input id="dic" name="dic" defaultValue={v("dic")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Poznámka</Label>
            <Textarea id="notes" name="notes" rows={2} defaultValue={v("notes")} />
          </div>

          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <div>
              <Label htmlFor="isActive">Aktívny</Label>
              <p className="text-xs text-muted-foreground">
                Neaktívny dodávateľ sa neponúka pri príjme na sklad.
              </p>
            </div>
            <Switch id="isActive" name="isActive" defaultChecked={supplier?.isActive ?? true} />
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
