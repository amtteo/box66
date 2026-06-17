"use client";

import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { saveOrganization } from "@/lib/orgs/actions";
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

export type OrgFormValues = {
  id: string;
  name: string;
  slug: string;
  legalName: string;
  ico: string;
  dic: string;
  icDph: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  isActive: boolean;
};

export function OrgDialog({
  organization,
  trigger,
}: {
  organization?: OrgFormValues;
  trigger?: ReactNode;
}) {
  const isEdit = !!organization;
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<FormState>(undefined);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await saveOrganization(undefined, formData);
      setState(result);
      if (result?.ok) {
        toast.success(isEdit ? "Organizácia bola uložená." : "Organizácia bola vytvorená.");
        setOpen(false);
      }
    });
  }

  const v = (k: keyof OrgFormValues) =>
    state?.values?.[k] ?? (organization ? String(organization[k] ?? "") : "");

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
            Nová organizácia
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Upraviť organizáciu" : "Nová organizácia"}</DialogTitle>
          <DialogDescription>
            Franšízant (tenant) — má vlastné predajne, tím, dodávateľov a receptúry.
          </DialogDescription>
        </DialogHeader>
        <form key={String(open)} action={onSubmit} className="space-y-4">
          {isEdit && <input type="hidden" name="id" value={organization.id} />}
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
            <Label htmlFor="legalName">Obchodné meno (voliteľné)</Label>
            <Input id="legalName" name="legalName" defaultValue={v("legalName")} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="ico">IČO</Label>
              <Input id="ico" name="ico" defaultValue={v("ico")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dic">DIČ</Label>
              <Input id="dic" name="dic" defaultValue={v("dic")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="icDph">IČ DPH</Label>
              <Input id="icDph" name="icDph" defaultValue={v("icDph")} />
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

          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <div>
              <Label htmlFor="isActive">Aktívna</Label>
              <p className="text-xs text-muted-foreground">
                Neaktívna organizácia ostáva v systéme, no je príznakom pozastavená.
              </p>
            </div>
            <Switch id="isActive" name="isActive" defaultChecked={organization?.isActive ?? true} />
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
