"use client";

import { useState, useTransition } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ImageIcon,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { FieldError, FormMessage } from "@/components/admin/form-feedback";
import { useCart } from "@/components/storefront/cart-context";
import { StripeCheckout } from "@/components/storefront/stripe-checkout";
import {
  finalizeCheckout,
  placeOrder,
  type OrderStatusInfo,
} from "@/lib/orders/actions";
import {
  CHECKOUT_ORDER_TYPES,
  ORDER_STATUS_LABEL,
  ORDER_TYPE_LABEL,
  PAYMENT_STATUS_LABEL,
} from "@/lib/orders/schemas";
import { OrderType, PaymentMethod } from "@/generated/prisma/enums";
import { formatMoney } from "@/lib/orders/types";

type View = "cart" | "checkout" | "payment" | "success";

export function CartSheet({
  storeId,
  currency,
  onlinePaymentEnabled,
  defaultCustomer,
}: {
  storeId: string;
  currency: string;
  onlinePaymentEnabled: boolean;
  defaultCustomer?: { name?: string; email?: string };
}) {
  const { lines, totalQuantity, subtotal, setQuantity, remove, clear } =
    useCart();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("cart");
  const [pending, startTransition] = useTransition();

  const [orderType, setOrderType] = useState<OrderType>(OrderType.TAKEAWAY);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    onlinePaymentEnabled ? PaymentMethod.ONLINE : PaymentMethod.CASH,
  );

  const [error, setError] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>();
  const [clientSecret, setClientSecret] = useState<string>();
  const [orderId, setOrderId] = useState<string>();
  const [success, setSuccess] = useState<OrderStatusInfo>();

  function resetOnClose(next: boolean) {
    setOpen(next);
    if (!next) {
      setError(undefined);
      setFieldErrors(undefined);
      if (view === "success") {
        setView("cart");
        setSuccess(undefined);
        setClientSecret(undefined);
        setOrderId(undefined);
      } else if (view === "payment") {
        setView("cart");
      }
    }
  }

  function handlePlaceOrder(formData: FormData) {
    setError(undefined);
    setFieldErrors(undefined);
    const payload = {
      storeId,
      type: orderType,
      paymentMethod,
      customerName: formData.get("customerName"),
      customerEmail: formData.get("customerEmail"),
      customerPhone: formData.get("customerPhone"),
      note: formData.get("note"),
      items: lines.map((l) => ({
        menuItemId: l.menuItemId,
        quantity: l.quantity,
        choices: l.choices.map((c) => ({
          groupId: c.groupId,
          menuItemId: c.menuItemId,
        })),
      })),
    };

    startTransition(async () => {
      const res = await placeOrder(payload);
      if (!res.ok) {
        setError(res.message);
        setFieldErrors(res.fieldErrors);
        return;
      }
      setOrderId(res.orderId);
      if (res.clientSecret) {
        setClientSecret(res.clientSecret);
        setView("payment");
      } else {
        setSuccess({
          orderNumber: res.orderNumber,
          status: "PENDING",
          paymentStatus: "UNPAID",
        });
        clear();
        setView("success");
      }
    });
  }

  function handlePaymentComplete() {
    startTransition(async () => {
      const info = orderId ? await finalizeCheckout(orderId) : null;
      setSuccess(
        info ?? { orderNumber: 0, status: "PENDING", paymentStatus: "PAID" },
      );
      clear();
      setView("success");
    });
  }

  return (
    <Sheet open={open} onOpenChange={resetOnClose}>
      <SheetTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-5 right-5 z-40 gap-2 rounded-full shadow-lg"
        >
          <ShoppingCart className="size-5" />
          <span className="tabular-nums" suppressHydrationWarning>
            {totalQuantity}
          </span>
          <span className="tabular-nums" suppressHydrationWarning>
            · {formatMoney(subtotal, currency)}
          </span>
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-full"
      >
        <SheetHeader className="border-b">
          <div className="mx-auto flex w-full max-w-2xl items-center gap-3">
            {(view === "checkout" || view === "payment") && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setView(view === "payment" ? "checkout" : "cart")}
                disabled={pending}
              >
                <ArrowLeft className="size-4" />
                <span className="sr-only">Späť</span>
              </Button>
            )}
            <div>
              <SheetTitle>
                {view === "cart" && "Košík"}
                {view === "checkout" && "Údaje a platba"}
                {view === "payment" && "Platba kartou"}
                {view === "success" && "Objednávka prijatá"}
              </SheetTitle>
              <SheetDescription>
                {view === "cart" && "Skontroluj položky pred objednaním."}
                {view === "checkout" && "Zadaj kontaktné údaje a spôsob platby."}
                {view === "payment" && "Bezpečná platba cez Stripe."}
                {view === "success" && "Ďakujeme za objednávku."}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-2xl p-4">
            {view === "cart" && (
              <CartView
                currency={currency}
                lines={lines}
                setQuantity={setQuantity}
                remove={remove}
              />
            )}

            {view === "checkout" && (
              <form
                id="checkout-form"
                action={handlePlaceOrder}
                className="space-y-5"
              >
                <FormMessage message={error} />

                <div className="space-y-2">
                  <Label htmlFor="customerName">Meno</Label>
                  <Input
                    id="customerName"
                    name="customerName"
                    placeholder="Tvoje meno"
                    defaultValue={defaultCustomer?.name}
                    autoComplete="name"
                  />
                  <FieldError messages={fieldErrors?.customerName} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="customerEmail">E-mail</Label>
                    <Input
                      id="customerEmail"
                      name="customerEmail"
                      type="email"
                      placeholder="email@example.com"
                      defaultValue={defaultCustomer?.email}
                      autoComplete="email"
                    />
                    <FieldError messages={fieldErrors?.customerEmail} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerPhone">Telefón</Label>
                    <Input
                      id="customerPhone"
                      name="customerPhone"
                      type="tel"
                      placeholder="+421…"
                      autoComplete="tel"
                    />
                    <FieldError messages={fieldErrors?.customerPhone} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orderType">Spôsob odberu</Label>
                  <Select
                    value={orderType}
                    onValueChange={(v) => setOrderType(v as OrderType)}
                  >
                    <SelectTrigger id="orderType" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CHECKOUT_ORDER_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {ORDER_TYPE_LABEL[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="note">Poznámka (voliteľné)</Label>
                  <Textarea
                    id="note"
                    name="note"
                    rows={2}
                    placeholder="Napr. bez cibule…"
                  />
                </div>

                <fieldset className="space-y-2">
                  <legend className="mb-1 text-sm font-medium">
                    Spôsob platby
                  </legend>
                  {onlinePaymentEnabled && (
                    <PaymentOption
                      checked={paymentMethod === PaymentMethod.ONLINE}
                      onSelect={() => setPaymentMethod(PaymentMethod.ONLINE)}
                      title="Online kartou"
                      description="Zaplatíš hneď cez Stripe."
                    />
                  )}
                  <PaymentOption
                    checked={paymentMethod === PaymentMethod.CASH}
                    onSelect={() => setPaymentMethod(PaymentMethod.CASH)}
                    title="V hotovosti pri prevzatí"
                    description="Zaplatíš pri vyzdvihnutí objednávky."
                  />
                </fieldset>
              </form>
            )}

            {view === "payment" && clientSecret && (
              <StripeCheckout
                clientSecret={clientSecret}
                onComplete={handlePaymentComplete}
              />
            )}

            {view === "success" && success && <SuccessView info={success} />}
          </div>
        </div>

        {(view === "cart" || view === "checkout" || view === "success") && (
          <div className="border-t bg-background">
            <div className="mx-auto w-full max-w-2xl space-y-3 p-4">
              {view !== "success" && (
                <div className="flex items-center justify-between text-base font-semibold">
                  <span>Spolu</span>
                  <span className="tabular-nums">
                    {formatMoney(subtotal, currency)}
                  </span>
                </div>
              )}

              {view === "cart" && (
                <Button
                  className="w-full"
                  size="lg"
                  disabled={lines.length === 0}
                  onClick={() => {
                    setError(undefined);
                    setView("checkout");
                  }}
                >
                  Pokračovať k objednávke
                </Button>
              )}

              {view === "checkout" && (
                <Button
                  type="submit"
                  form="checkout-form"
                  className="w-full"
                  size="lg"
                  disabled={pending || lines.length === 0}
                >
                  {pending
                    ? "Spracúvam…"
                    : paymentMethod === PaymentMethod.ONLINE
                      ? "Prejsť na platbu"
                      : "Objednať"}
                </Button>
              )}

              {view === "success" && (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => resetOnClose(false)}
                >
                  Hotovo
                </Button>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function CartView({
  currency,
  lines,
  setQuantity,
  remove,
}: {
  currency: string;
  lines: ReturnType<typeof useCart>["lines"];
  setQuantity: ReturnType<typeof useCart>["setQuantity"];
  remove: ReturnType<typeof useCart>["remove"];
}) {
  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
        <ShoppingCart className="size-10" />
        <p>Košík je prázdny. Pridaj niečo z menu.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y">
      {lines.map((line) => (
        <li key={line.lineId} className="flex items-center gap-3 py-3">
          <div className="relative size-14 shrink-0 overflow-hidden rounded-md border bg-muted">
            {line.imageUrl ? (
              <Image
                src={line.imageUrl}
                alt={line.name}
                fill
                sizes="56px"
                className="object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center">
                <ImageIcon className="size-5 text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{line.name}</p>
            {line.choices.length > 0 && (
              <p className="truncate text-xs text-muted-foreground">
                {line.choices.map((c) => c.name).join(", ")}
              </p>
            )}
            <p className="text-sm text-muted-foreground tabular-nums">
              {formatMoney(line.price, currency)}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setQuantity(line.lineId, line.quantity - 1)}
            >
              <Minus className="size-4" />
            </Button>
            <span className="w-6 text-center tabular-nums">{line.quantity}</span>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setQuantity(line.lineId, line.quantity + 1)}
            >
              <Plus className="size-4" />
            </Button>
          </div>

          <div className="w-20 text-right font-medium tabular-nums">
            {formatMoney(line.price * line.quantity, currency)}
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => remove(line.lineId)}
          >
            <Trash2 className="size-4" />
            <span className="sr-only">Odstrániť</span>
          </Button>
        </li>
      ))}
    </ul>
  );
}

function PaymentOption({
  checked,
  onSelect,
  title,
  description,
}: {
  checked: boolean;
  onSelect: () => void;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={checked}
      className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition ${
        checked ? "border-primary ring-1 ring-primary" : "hover:bg-accent"
      }`}
    >
      <span
        className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border ${
          checked ? "border-primary" : ""
        }`}
      >
        {checked && <span className="size-2 rounded-full bg-primary" />}
      </span>
      <span>
        <span className="block font-medium">{title}</span>
        <span className="block text-sm text-muted-foreground">
          {description}
        </span>
      </span>
    </button>
  );
}

function SuccessView({ info }: { info: OrderStatusInfo }) {
  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      <CheckCircle2 className="size-14 text-emerald-600" />
      <div className="space-y-1">
        <p className="text-lg font-semibold">
          {info.orderNumber > 0
            ? `Objednávka č. ${info.orderNumber}`
            : "Objednávka prijatá"}
        </p>
        <p className="text-muted-foreground">
          Stav: {ORDER_STATUS_LABEL[info.status]} · Platba:{" "}
          {PAYMENT_STATUS_LABEL[info.paymentStatus]}
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Badge variant="secondary">{ORDER_STATUS_LABEL[info.status]}</Badge>
        <Badge variant="outline">
          {PAYMENT_STATUS_LABEL[info.paymentStatus]}
        </Badge>
      </div>
      <p className="max-w-sm text-sm text-muted-foreground">
        Tvoju objednávku potvrdí obsluha. Ďakujeme!
      </p>
    </div>
  );
}
