"use client";

import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { saveStore } from "@/lib/stores/actions";
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
import { FieldError, FormMessage } from "@/components/admin/form-feedback";

export type StoreFormValues = {
  id: string;
  name: string;
  slug: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  currency: string;
  isActive: boolean;
};

export function StoreDialog({
  store,
  trigger,
}: {
  store?: StoreFormValues;
  trigger?: ReactNode;
}) {
  const isEdit = !!store;
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<FormState>(undefined);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await saveStore(undefined, formData);
      setState(result);
      if (result?.ok) {
        toast.success(isEdit ? "Predajňa bola uložená." : "Predajňa bola vytvorená.");
        setOpen(false);
      }
    });
  }

  const v = (k: keyof StoreFormValues) =>
    state?.values?.[k] ?? (store ? String(store[k] ?? "") : "");

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
            Nová predajňa
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Upraviť predajňu" : "Nová predajňa"}</DialogTitle>
          <DialogDescription>
            Fyzická prevádzka tvojej organizácie — má vlastné menu a sklad.
          </DialogDescription>
        </DialogHeader>
        <form key={String(open)} action={onSubmit} className="space-y-4">
          {isEdit && <input type="hidden" name="id" value={store.id} />}
          <FormMessage message={state?.message} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Názov</Label>
              <Input id="name" name="name" defaultValue={v("name")} required />
              <FieldError messages={state?.errors?.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (voliteľné)</Label>
              <Input id="slug" name="slug" defaultValue={v("slug")} placeholder="vygeneruje sa z názvu" />
              <FieldError messages={state?.errors?.slug} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="street">Ulica</Label>
            <Input id="street" name="street" defaultValue={v("street")} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="city">Mesto</Label>
              <Input id="city" name="city" defaultValue={v("city")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode">PSČ</Label>
              <Input id="postalCode" name="postalCode" defaultValue={v("postalCode")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Krajina</Label>
              <Input id="country" name="country" defaultValue={v("country") || "SK"} maxLength={2} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefón</Label>
              <Input id="phone" name="phone" defaultValue={v("phone")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" defaultValue={v("email")} />
              <FieldError messages={state?.errors?.email} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Mena</Label>
              <Input id="currency" name="currency" defaultValue={v("currency") || "EUR"} maxLength={3} />
              <FieldError messages={state?.errors?.currency} />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <div>
              <Label htmlFor="isActive">Aktívna</Label>
              <p className="text-xs text-muted-foreground">
                Neaktívna predajňa sa nezobrazuje zákazníkom.
              </p>
            </div>
            <Switch id="isActive" name="isActive" defaultChecked={store?.isActive ?? true} />
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
