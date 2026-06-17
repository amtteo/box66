"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

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
import type { FormState } from "@/lib/forms";

type Props = {
  id: string;
  name: string;
  action: (id: string) => Promise<FormState>;
  description?: string;
  variant?: "icon" | "inline";
  disabled?: boolean;
  onDeleted?: () => void;
};

export function DeleteButton({
  id,
  name,
  action,
  description,
  variant = "icon",
  disabled = false,
  onDeleted,
}: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function onConfirm() {
    startTransition(async () => {
      const res = await action(id);
      if (res?.ok) {
        toast.success(`„${name}" bolo zmazané.`);
        setOpen(false);
        onDeleted?.();
      } else {
        toast.error(res?.message ?? "Položku sa nepodarilo zmazať.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {variant === "inline" ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="size-4" />
            Zmazať natrvalo
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-4" />
            <span className="sr-only">Zmazať</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Zmazať {name}?</DialogTitle>
          <DialogDescription>
            {description ?? "Túto akciu nemožno vrátiť späť."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={pending}>
              Zrušiť
            </Button>
          </DialogClose>
          <Button variant="destructive" onClick={onConfirm} disabled={pending}>
            {pending ? "Mažem…" : "Zmazať"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
