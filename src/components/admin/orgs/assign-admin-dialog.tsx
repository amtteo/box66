"use client";

import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

import { assignOrgAdmin } from "@/lib/orgs/actions";
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

export function AssignAdminDialog({
  organizationId,
  organizationName,
  trigger,
}: {
  organizationId: string;
  organizationName: string;
  trigger?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<FormState>(undefined);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await assignOrgAdmin(undefined, formData);
      setState(result);
      if (result?.ok) {
        toast.success("Administrátor bol priradený.");
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
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <UserPlus className="size-4" />
            Priradiť admina
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Priradiť administrátora</DialogTitle>
          <DialogDescription>
            Zadaj e-mail registrovaného používateľa — stane sa ADMINom organizácie „{organizationName}“.
          </DialogDescription>
        </DialogHeader>
        <form key={String(open)} action={onSubmit} className="space-y-4">
          <input type="hidden" name="organizationId" value={organizationId} />
          <FormMessage message={state?.message} />
          <div className="space-y-2">
            <Label htmlFor="email">E-mail používateľa</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={state?.values?.email}
              placeholder="franchisee@example.com"
              required
            />
            <FieldError messages={state?.errors?.email} />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={pending}>
                Zrušiť
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? "Priraďujem…" : "Priradiť"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
