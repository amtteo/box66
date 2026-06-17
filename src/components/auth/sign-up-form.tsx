"use client";

import Link from "next/link";
import { useActionState } from "react";

import { signUp } from "@/lib/auth/actions";
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

export function SignUpForm() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    signUp,
    undefined,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrácia</CardTitle>
        <CardDescription>Vytvor si účet v platforme Box66.</CardDescription>
      </CardHeader>
      <form action={action}>
        <CardContent className="space-y-4">
          <FormMessage message={state?.message} />
          <div className="space-y-2">
            <Label htmlFor="fullName">Meno a priezvisko</Label>
            <Input
              id="fullName"
              name="fullName"
              autoComplete="name"
              defaultValue={state?.values?.fullName}
              required
            />
            <FieldError messages={state?.errors?.fullName} />
          </div>
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
              autoComplete="new-password"
              required
            />
            <FieldError messages={state?.errors?.password} />
            <p className="text-xs text-muted-foreground">
              Aspoň 8 znakov, jedno písmeno a jedno číslo.
            </p>
          </div>
        </CardContent>
        <CardFooter className="mt-6 flex-col gap-4">
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Vytváram účet…" : "Zaregistrovať sa"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Už máš účet?{" "}
            <Link href="/prihlasenie" className="text-foreground underline">
              Prihlás sa
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
