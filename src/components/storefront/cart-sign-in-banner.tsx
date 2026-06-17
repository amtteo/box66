"use client";

import { ArrowRight } from "lucide-react";
import { useActionState, useEffect, useId, useState } from "react";

import { FieldError, FormMessage } from "@/components/auth/form-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInForCheckout } from "@/lib/auth/actions";
import type { CheckoutSignInState } from "@/lib/auth/schemas";
import { cn } from "@/lib/utils";

export function CartSignInBanner({
  onSuccess,
}: {
  onSuccess: (customer: { name?: string; email: string }) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [state, action, pending] = useActionState<
    CheckoutSignInState,
    FormData
  >(signInForCheckout, undefined);
  const id = useId();
  const emailId = `${id}-email`;
  const passwordId = `${id}-password`;

  useEffect(() => {
    if (state && "ok" in state && state.ok) {
      onSuccess(state.customer);
    }
  }, [state, onSuccess]);

  useEffect(() => {
    if (state && !("ok" in state && state.ok)) {
      setExpanded(true);
    }
  }, [state]);

  return (
    <form action={action} className="overflow-hidden rounded-lg border-2 border-primary">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <span className="font-semibold">Prihláste sa</span>
        <Button
          type="button"
          size="sm"
          className="shrink-0 bg-yellow-400 font-bold text-primary hover:bg-yellow-500"
          onClick={() => setExpanded(true)}
        >
          Prihlásiť
        </Button>
      </div>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-in-out",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-3 border-t border-primary/20 px-4 pb-4 pt-3">
            <FormMessage
              message={
                state && !("ok" in state && state.ok) ? state.message : undefined
              }
            />
            <div className="flex items-center gap-2">
              <Label htmlFor={emailId} className="sr-only">
                E-mail
              </Label>
              <Input
                id={emailId}
                name="email"
                type="email"
                placeholder="E-mail"
                autoComplete="email"
                className="min-w-0 flex-1"
                defaultValue={
                  state && !("ok" in state && state.ok)
                    ? state.values?.email
                    : undefined
                }
                required
              />
              <Label htmlFor={passwordId} className="sr-only">
                Heslo
              </Label>
              <Input
                id={passwordId}
                name="password"
                type="password"
                placeholder="Heslo"
                autoComplete="current-password"
                className="min-w-0 flex-1"
                required
              />
              <Button
                type="submit"
                size="icon"
                className="size-12 shrink-0 bg-yellow-400 text-primary hover:bg-yellow-500"
                disabled={pending}
                aria-label="Prihlásiť sa"
              >
                <ArrowRight className="size-5" />
              </Button>
            </div>
            <FieldError
              messages={
                state && !("ok" in state && state.ok)
                  ? [
                      ...(state.errors?.email ?? []),
                      ...(state.errors?.password ?? []),
                    ]
                  : undefined
              }
            />
          </div>
        </div>
      </div>
    </form>
  );
}
