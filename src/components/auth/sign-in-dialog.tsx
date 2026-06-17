"use client";

import type { ReactNode } from "react";

import { SignInForm } from "@/components/auth/sign-in-form";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

export function SignInDialog({
  redirectTo = "/",
  trigger,
  open,
  onOpenChange,
}: {
  redirectTo?: string;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent showCloseButton>
        <SignInForm variant="inline" redirectTo={redirectTo} />
      </DialogContent>
    </Dialog>
  );
}
