"use client";

import Link from "next/link";
import { useActionState } from "react";

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

export function SignInForm() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    signIn,
    undefined,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prihlásenie</CardTitle>
        <CardDescription>Prihlás sa do administrácie Box66.</CardDescription>
      </CardHeader>
      <form action={action}>
        <CardContent className="space-y-4">
          <FormMessage message={state?.message} />
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              defaultValue={state?.values?.email}
              required
            />
            <FieldError messages={state?.errors?.email} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Heslo</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
            <FieldError messages={state?.errors?.password} />
          </div>
        </CardContent>
        <CardFooter className="mt-6 flex-col gap-4">
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Prihlasujem…" : "Prihlásiť sa"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Nemáš účet?{" "}
            <Link href="/registracia" className="text-foreground underline">
              Zaregistruj sa
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
