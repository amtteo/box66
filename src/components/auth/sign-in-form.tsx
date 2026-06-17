"use client";

import Link from "next/link";
import { useActionState, useId } from "react";

import { signIn } from "@/lib/auth/actions";
import type { AuthFormState } from "@/lib/auth/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError, FormMessage } from "@/components/auth/form-feedback";

export type SignInFormProps = {
  redirectTo?: string;
  variant?: "page" | "inline";
  showSignUpLink?: boolean;
};

export function signInDescription(redirectTo: string) {
  return redirectTo.startsWith("/admin")
    ? "Prihlás sa do administrácie Box66."
    : "Prihlás sa a predvyplníme tvoje údaje pri objednávke.";
}

export function SignInForm({
  redirectTo = "/",
  variant = "page",
  showSignUpLink = true,
}: SignInFormProps) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    signIn,
    undefined,
  );
  const id = useId();
  const emailId = `${id}-email`;
  const passwordId = `${id}-password`;
  const description = signInDescription(redirectTo);

  const fields = (
    <>
      <FormMessage message={state?.message} />
      <input type="hidden" name="redirect" value={redirectTo} />
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
          autoComplete="current-password"
          required
        />
        <FieldError messages={state?.errors?.password} />
      </div>
    </>
  );

  const footer = (
    <>
      <Button type="submit" className="w-full h-14 bg-yellow-400 hover:bg-yellow-500 text-primary font-bold text-md" disabled={pending}>
        {pending ? "Prihlasujem…" : "Prihlásiť sa"}
      </Button>
      {showSignUpLink && (
        <div className="text-center text-sm text-muted-foreground mt-8 flex flex-col gap-8">
          <Link
            href={`/registracia?redirect=${encodeURIComponent(redirectTo)}`}
            className="text-foreground underline"
          >
            Vytvorit účet
          </Link>
          <Link
            href="/"
            className="text-foreground underline"
          >
            Uvodná stránka
          </Link>
        </div>
      )}
    </>
  );

  if (variant === "inline") {
    return (
      <form action={action} className="space-y-4">
        <div className="space-y-4">{fields}</div>
        <div className="flex flex-col gap-4 mt-4">{footer}</div>
      </form>
    );
  }

  return (
    <div className="p-8">
      <form action={action}>
        <div className="space-y-4">{fields}</div>
        <div className="mt-6 flex-col gap-4">{footer}</div>
      </form>
    </div>
  );
}
