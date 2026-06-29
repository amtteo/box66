"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import {
  Banknote,
  CheckCircle2,
  CreditCard,
  ImageIcon,
  Minus,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ComboChoiceDialog } from "@/components/storefront/combo-choice-dialog";
import { cn } from "@/lib/utils";
import { placePosOrder } from "@/lib/orders/pos-actions";
import { ORDER_TYPE_LABEL } from "@/lib/orders/schemas";
import { POS_ORDER_TYPES } from "@/lib/orders/pos-schemas";
import { OrderType, PaymentMethod } from "@/generated/prisma/enums";
import {
  formatMoney,
  type CartChoice,
  type CartLine,
  type MenuCategoryDTO,
  type MenuItemDTO,
} from "@/lib/orders/types";

function lineId(menuItemId: string, choices: CartChoice[]): string {
  const sig = [...choices]
    .map((c) => `${c.groupId}:${c.menuItemId}`)
    .sort()
    .join(",");
  return sig ? `${menuItemId}#${sig}` : menuItemId;
}

function addLine(
  lines: CartLine[],
  item: MenuItemDTO,
  choices: CartChoice[],
): CartLine[] {
  const id = lineId(item.id, choices);
  const existing = lines.find((l) => l.lineId === id);
  if (existing) {
    return lines.map((l) =>
      l.lineId === id ? { ...l, quantity: l.quantity + 1 } : l,
    );
  }
  return [
    ...lines,
    {
      lineId: id,
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      imageUrl: item.imageUrl,
      choices,
    },
  ];
}

export function PosBoard({
  storeId,
  storeName,
  currency,
  categories,
}: {
  storeId: string;
  storeName: string;
  currency: string;
  categories: MenuCategoryDTO[];
}) {
  const [activeCategoryId, setActiveCategoryId] = useState(
    categories[0]?.id ?? "",
  );
  const [lines, setLines] = useState<CartLine[]>([]);
  const [comboItem, setComboItem] = useState<MenuItemDTO | null>(null);
  const [orderType, setOrderType] = useState<OrderType>(OrderType.TAKEAWAY);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PaymentMethod.CASH,
  );
  const [customerName, setCustomerName] = useState("");
  const [note, setNote] = useState("");
  const [lastOrderNumber, setLastOrderNumber] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  const activeCategory = useMemo(
    () => categories.find((c) => c.id === activeCategoryId) ?? categories[0],
    [activeCategoryId, categories],
  );

  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + l.price * l.quantity, 0),
    [lines],
  );

  function handleAddItem(item: MenuItemDTO) {
    if (item.choiceGroups.length > 0) {
      setComboItem(item);
      return;
    }
    setLines((prev) => addLine(prev, item, []));
  }

  function setQuantity(lineId: string, quantity: number) {
    if (quantity < 1) {
      setLines((prev) => prev.filter((l) => l.lineId !== lineId));
      return;
    }
    setLines((prev) =>
      prev.map((l) => (l.lineId === lineId ? { ...l, quantity } : l)),
    );
  }

  function clearCart() {
    setLines([]);
    setCustomerName("");
    setNote("");
    setLastOrderNumber(null);
  }

  function submitOrder() {
    startTransition(async () => {
      const res = await placePosOrder({
        storeId,
        type: orderType,
        paymentMethod,
        customerName: customerName || undefined,
        note: note || undefined,
        items: lines.map((l) => ({
          menuItemId: l.menuItemId,
          quantity: l.quantity,
          note: null,
          choices: l.choices.map((c) => ({
            groupId: c.groupId,
            menuItemId: c.menuItemId,
          })),
        })),
      });

      if (res.ok) {
        setLastOrderNumber(res.orderNumber);
        setLines([]);
        setCustomerName("");
        setNote("");
        toast.success(`Objednávka #${res.orderNumber} vytvorená a potvrdená.`);
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-4 lg:flex-row">
      <section className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              type="button"
              size="lg"
              variant={cat.id === activeCategory?.id ? "default" : "outline"}
              onClick={() => setActiveCategoryId(cat.id)}
            >
              {cat.name}
            </Button>
          ))}
        </div>

        <div className="grid flex-1 auto-rows-fr gap-3 overflow-y-auto sm:grid-cols-2 xl:grid-cols-3">
          {activeCategory?.items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleAddItem(item)}
              className="flex flex-col rounded-xl border-2 border-border bg-card p-4 text-left transition hover:border-primary hover:shadow-md"
            >
              <div className="relative mb-3 aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-contain"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center">
                    <ImageIcon className="size-10 text-muted-foreground" />
                  </div>
                )}
              </div>
              <span className="text-lg font-semibold leading-tight">
                {item.name}
              </span>
              <span className="mt-1 text-base font-bold tabular-nums text-primary">
                {formatMoney(item.price, currency)}
              </span>
            </button>
          ))}
        </div>
      </section>

      <Card className="flex w-full shrink-0 flex-col lg:w-[380px] xl:w-[420px]">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Košík — {storeName}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-4">
          {lastOrderNumber != null && lines.length === 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-100">
              <CheckCircle2 className="size-5 shrink-0" />
              <span>
                Posledná objednávka: <strong>#{lastOrderNumber}</strong>
              </span>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {POS_ORDER_TYPES.map((type) => (
              <Button
                key={type}
                type="button"
                size="sm"
                variant={orderType === type ? "default" : "outline"}
                onClick={() => setOrderType(type)}
              >
                {ORDER_TYPE_LABEL[type]}
              </Button>
            ))}
          </div>

          <ul className="max-h-64 space-y-2 overflow-y-auto">
            {lines.length === 0 ? (
              <li className="py-8 text-center text-sm text-muted-foreground">
                Pridaj položky z menu.
              </li>
            ) : (
              lines.map((line) => (
                <li
                  key={line.lineId}
                  className="flex items-start justify-between gap-2 rounded-lg border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{line.name}</p>
                    {line.choices.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {line.choices.map((c) => c.name).join(", ")}
                      </p>
                    )}
                    <p className="text-sm tabular-nums text-muted-foreground">
                      {formatMoney(line.price, currency)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="size-8"
                      onClick={() =>
                        setQuantity(line.lineId, line.quantity - 1)
                      }
                    >
                      <Minus className="size-4" />
                    </Button>
                    <span className="w-6 text-center tabular-nums">
                      {line.quantity}
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="size-8"
                      onClick={() =>
                        setQuantity(line.lineId, line.quantity + 1)
                      }
                    >
                      <Plus className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-8 text-destructive"
                      onClick={() => setQuantity(line.lineId, 0)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </li>
              ))
            )}
          </ul>

          <div className="space-y-2">
            <Label htmlFor="pos-customer">Meno (voliteľné)</Label>
            <Input
              id="pos-customer"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Zákazník"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pos-note">Poznámka</Label>
            <Textarea
              id="pos-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Napr. bez cibule"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              size="lg"
              variant={paymentMethod === PaymentMethod.CASH ? "default" : "outline"}
              onClick={() => setPaymentMethod(PaymentMethod.CASH)}
              className="h-14"
            >
              <Banknote className="mr-2 size-5" />
              Hotovosť
            </Button>
            <Button
              type="button"
              size="lg"
              variant={paymentMethod === PaymentMethod.CARD ? "default" : "outline"}
              onClick={() => setPaymentMethod(PaymentMethod.CARD)}
              className="h-14"
            >
              <CreditCard className="mr-2 size-5" />
              Karta
            </Button>
          </div>

          <div className="mt-auto space-y-3 border-t pt-4">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Spolu</span>
              <span className="tabular-nums">
                {formatMoney(subtotal, currency)}
              </span>
            </div>
            <Button
              type="button"
              size="lg"
              className={cn("h-14 w-full text-lg font-bold")}
              disabled={lines.length === 0 || pending}
              onClick={submitOrder}
            >
              {pending ? "Odosielam…" : "Vytvoriť objednávku"}
            </Button>
            {lines.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={clearCart}
                disabled={pending}
              >
                Vyprázdniť košík
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <ComboChoiceDialog
        item={comboItem}
        currency={currency}
        onClose={() => setComboItem(null)}
        onConfirm={(item, choices) => {
          setLines((prev) => addLine(prev, item, choices));
        }}
      />
    </div>
  );
}
