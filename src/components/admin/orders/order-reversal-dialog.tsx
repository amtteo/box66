"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updateOrderStatus } from "@/lib/orders/actions";
import {
  defaultRestoreStock,
  ORDER_STATUS_LABEL,
  orderHadStockDeducted,
} from "@/lib/orders/schemas";
import type { OrderStatus as OrderStatusType } from "@/generated/prisma/enums";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const REVERSAL_LABEL: Partial<Record<OrderStatusType, string>> = {
  CANCELLED: "Zrušiť objednávku",
  REFUNDED: "Refundovať objednávku",
};

export function OrderReversalDialog({
  orderId,
  orderNumber,
  currentStatus,
  nextStatus,
  trigger,
}: {
  orderId: string;
  orderNumber: number;
  currentStatus: OrderStatusType;
  nextStatus: "CANCELLED" | "REFUNDED";
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const showStockSwitch = orderHadStockDeducted(currentStatus);
  const [restoreStock, setRestoreStock] = useState(() =>
    defaultRestoreStock(currentStatus),
  );

  const title = REVERSAL_LABEL[nextStatus] ?? ORDER_STATUS_LABEL[nextStatus];

  function onConfirm() {
    startTransition(async () => {
      const res = await updateOrderStatus(orderId, nextStatus, {
        restoreStock: showStockSwitch ? restoreStock : false,
      });
      if (res.ok) {
        toast.success(`Objednávka #${orderNumber}: ${ORDER_STATUS_LABEL[nextStatus]}.`);
        setOpen(false);
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setRestoreStock(defaultRestoreStock(currentStatus));
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {title} #{orderNumber}?
          </DialogTitle>
          <DialogDescription>
            {nextStatus === "REFUNDED"
              ? "Peniaze sa vrátia zákazníkovi (ak bola online platba). Stav objednávky sa zmení na vrátenú."
              : "Objednávka sa označí ako zrušená."}
          </DialogDescription>
        </DialogHeader>

        {showStockSwitch && (
          <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
            <div className="space-y-1">
              <Label htmlFor="restoreStock" className="text-base">
                Vrátiť suroviny na sklad
              </Label>
              <p className="text-sm text-muted-foreground">
                Zapni, ak sa ešte nevarilo a suroviny môžu ísť späť do zásob.
                Vypni pri hotovom burgri — zostanú ako spotreba (odpis).
              </p>
            </div>
            <Switch
              id="restoreStock"
              checked={restoreStock}
              onCheckedChange={setRestoreStock}
              disabled={pending}
            />
          </div>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={pending}>
              Späť
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? "Spracúvam…" : title}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
