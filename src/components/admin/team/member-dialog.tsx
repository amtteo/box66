"use client";

import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

import { inviteMember, updateMember } from "@/lib/team/actions";
import { ASSIGNABLE_ROLES } from "@/lib/team/schemas";
import { ROLE_LABEL, type Role } from "@/lib/rbac";
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

export type StoreOption = { id: string; name: string };

export type MemberFormValues = {
  membershipId: string;
  email: string;
  role: string;
  storeId: string;
};

export function MemberDialog({
  member,
  stores,
  trigger,
}: {
  member?: MemberFormValues;
  stores: StoreOption[];
  trigger?: ReactNode;
}) {
  const isEdit = !!member;
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<FormState>(undefined);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = isEdit
        ? await updateMember(undefined, formData)
        : await inviteMember(undefined, formData);
      setState(result);
      if (result?.ok) {
        toast.success(isEdit ? "Člen bol upravený." : "Člen bol priradený.");
        setOpen(false);
      }
    });
  }

  const noStores = stores.length === 0;

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
          <Button disabled={noStores}>
            <UserPlus className="size-4" />
            Priradiť člena
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Upraviť člena tímu" : "Priradiť člena tímu"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Zmeň rolu alebo predajňu člena."
              : "Zadaj e-mail registrovaného používateľa a prideľ mu rolu v predajni."}
          </DialogDescription>
        </DialogHeader>
        <form key={String(open)} action={onSubmit} className="space-y-4">
          {isEdit && <input type="hidden" name="membershipId" value={member.membershipId} />}
          <FormMessage message={state?.message} />

          <div className="space-y-2">
            <Label htmlFor="email">E-mail používateľa</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={state?.values?.email ?? member?.email}
              disabled={isEdit}
              required={!isEdit}
            />
            <FieldError messages={state?.errors?.email} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="storeId">Predajňa</Label>
            <Select name="storeId" defaultValue={state?.values?.storeId ?? member?.storeId}>
              <SelectTrigger id="storeId" className="w-full">
                <SelectValue placeholder="Vyber predajňu" />
              </SelectTrigger>
              <SelectContent>
                {stores.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError messages={state?.errors?.storeId} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rola</Label>
            <Select name="role" defaultValue={state?.values?.role ?? member?.role}>
              <SelectTrigger id="role" className="w-full">
                <SelectValue placeholder="Vyber rolu" />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNABLE_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABEL[r as Role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError messages={state?.errors?.role} />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={pending}>
                Zrušiť
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? "Ukladám…" : isEdit ? "Uložiť" : "Priradiť"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
