"use client";

import Link from "next/link";
import { useActionState, useId } from "react";

import { completeInviteSignUp } from "@/lib/customer-invite/actions";
import type { AuthFormState } from "@/lib/auth/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError, FormMessage } from "@/components/auth/form-feedback";

type Props = {
  token: string;
  phone: string;
  fullName: string | null;
};

export function NewUserSignUpForm({ token, phone, fullName }: Props) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    completeInviteSignUp,
    undefined,
  );
  const id = useId();

  return (
    <div className="p-8">
      <p className="mb-6 text-sm text-muted-foreground">
        Nový účet pre tel. č. <span className="font-medium text-foreground">{phone}</span>
      </p>
      <form action={action}>
        <div className="space-y-4">
          <FormMessage message={state?.message} />
          <input type="hidden" name="token" value={token} />
          <div className="space-y-2">
            <Label htmlFor={`${id}-fullName`}>Meno a priezvisko</Label>
            <Input
              id={`${id}-fullName`}
              name="fullName"
              autoComplete="name"
              defaultValue={state?.values?.fullName ?? fullName ?? ""}
            />
            <FieldError messages={state?.errors?.fullName} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${id}-email`}>E-mail</Label>
            <Input
              id={`${id}-email`}
              name="email"
              type="email"
              autoComplete="email"
              defaultValue={state?.values?.email}
              required
            />
            <FieldError messages={state?.errors?.email} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${id}-password`}>Heslo</Label>
            <Input
              id={`${id}-password`}
              name="password"
              type="password"
              autoComplete="new-password"
              required
            />
            <FieldError messages={state?.errors?.password} />
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-4">
          <Button
            type="submit"
            className="h-14 w-full bg-yellow-400 text-md font-bold text-primary hover:bg-yellow-500"
            disabled={pending}
          >
            {pending ? "Vytváram účet…" : "Dokončiť registráciu"}
          </Button>
          <div className="mt-4 flex flex-col gap-4 text-center text-sm text-muted-foreground">
            <Link href="/" className="text-foreground underline">
              Úvodná stránka
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
