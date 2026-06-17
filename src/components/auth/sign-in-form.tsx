"use client";

import Link from "next/link";
import { useActionState, useId } from "react";

import { signIn } from "@/lib/auth/actions";
import type { AuthFormState } from "@/lib/auth/schemas";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError, FormMessage } from "@/components/auth/form-feedback";

export type SignInFormProps = {
  redirectTo?: string;
  variant?: "page" | "inline";
  showSignUpLink?: boolean;
};

function signInDescription(redirectTo: string) {
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
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Prihlasujem…" : "Prihlásiť sa"}
      </Button>
      {showSignUpLink && (
        <p className="text-center text-sm text-muted-foreground">
          Nemáš účet?{" "}
          <Link
            href={`/registracia?redirect=${encodeURIComponent(redirectTo)}`}
            className="text-foreground underline"
          >
            Zaregistruj sa
          </Link>
        </p>
      )}
    </>
  );

  if (variant === "inline") {
    return (
      <form action={action} className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Prihlásenie</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="space-y-4">{fields}</div>
        <div className="flex flex-col gap-4">{footer}</div>
      </form>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prihlásenie</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <form action={action}>
        <CardContent className="space-y-4">{fields}</CardContent>
        <CardFooter className="mt-6 flex-col gap-4">{footer}</CardFooter>
      </form>
    </Card>
  );
}
