"use client";

import Link from "next/link";
import { useActionState, useId } from "react";

import { signUp } from "@/lib/auth/actions";
import type { AuthFormState } from "@/lib/auth/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError, FormMessage } from "@/components/auth/form-feedback";

export function SignUpForm({ redirectTo = "/" }: { redirectTo?: string }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    signUp,
    undefined,
  );
  const id = useId();
  const fullNameId = `${id}-fullName`;
  const emailId = `${id}-email`;
  const passwordId = `${id}-password`;

  return (
    <div className="p-8">
      <form action={action}>
        <div className="space-y-4">
          <FormMessage message={state?.message} />
          <input type="hidden" name="redirect" value={redirectTo} />
          <div className="space-y-2">
            <Label htmlFor={fullNameId}>Meno a priezvisko</Label>
            <Input
              id={fullNameId}
              name="fullName"
              autoComplete="name"
              defaultValue={state?.values?.fullName}
              required
            />
            <FieldError messages={state?.errors?.fullName} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={emailId}>E-mail</Label>
            <Input
              id={emailId}
              name="email"
              type="email"
              autoComplete="email"
              defaultValue={state?.values?.email}
              required
            />
            <FieldError messages={state?.errors?.email} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={passwordId}>Heslo</Label>
            <Input
              id={passwordId}
              name="password"
              type="password"
              autoComplete="new-password"
              required
            />
            <FieldError messages={state?.errors?.password} />
          </div>
        </div>
        <div className="mt-6 flex-col gap-4">
          <Button
            type="submit"
            className="w-full h-14 bg-yellow-400 hover:bg-yellow-500 text-primary font-bold text-md"
            disabled={pending}
          >
            {pending ? "Vytváram účet…" : "Zaregistrovať sa"}
          </Button>
          <div className="text-center text-sm text-muted-foreground mt-8 flex flex-col gap-8">
            <Link
              href={`/prihlasenie?redirect=${encodeURIComponent(redirectTo)}`}
              className="text-foreground underline"
            >
              Prihlásiť sa
            </Link>
            <Link href="/" className="text-foreground underline">
              Uvodná stránka
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
