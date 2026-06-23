"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Gift,
  ImageIcon,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
  User,
  X,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetCloseButton,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { FieldError, FormMessage } from "@/components/admin/form-feedback";
import { CartSignInBanner } from "@/components/storefront/cart-sign-in-banner";
import { showCartAddedToast } from "@/components/storefront/cart-added-toast";
import { LoyaltyRewardsPanel, LoyaltySelectedSummary } from "@/components/storefront/loyalty-rewards-panel";
import { LoyaltyRewardChoiceDialog } from "@/components/storefront/loyalty-reward-choice-dialog";
import { useStorefront } from "@/components/storefront/storefront-context";
import { useCart } from "@/components/storefront/cart-context";
import { fetchStoreLoyalty } from "@/lib/loyalty/storefront";
import { hasLoyaltyRewards, paidSubtotal } from "@/lib/loyalty/cart";
import { LOYALTY_MIN_PAID_SUBTOTAL } from "@/lib/loyalty/constants";
import type { LoyaltyBalanceDTO, LoyaltyRewardDTO } from "@/lib/loyalty/types";
import { StripeCheckout } from "@/components/storefront/stripe-checkout";
import { cn } from "@/lib/utils";
import {
  finalizeCheckout,
  placeOrder,
  type OrderStatusInfo,
} from "@/lib/orders/actions";
import {
  ORDER_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
} from "@/lib/orders/schemas";
import { OrderType, PaymentMethod } from "@/generated/prisma/enums";
import { formatMoney, type CartChoice, type CartLine } from "@/lib/orders/types";
import { formatDeliveryDuration } from "@/lib/delivery/format";

type View = "cart" | "rewards" | "checkout" | "payment" | "success";

export function CartSheet({
  storeId,
  currency,
  onlinePaymentEnabled,
  defaultCustomer,
  isAuthed = false,
}: {
  storeId: string;
  currency: string;
  onlinePaymentEnabled: boolean;
  defaultCustomer?: { name?: string; email?: string };
  isAuthed?: boolean;
}) {
  const {
    lines,
    totalQuantity,
    subtotal,
    pointsHeld,
    setQuantity,
    remove,
    clear,
    addReward,
    rewardQuantity,
  } = useCart();
  const { delivery, deliveryCoords, fulfillmentMode, requestFulfillmentSetup } =
    useStorefront();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("cart");
  const [pending, startTransition] = useTransition();
  const [signedIn, setSignedIn] = useState(isAuthed);
  const [customerName, setCustomerName] = useState(defaultCustomer?.name ?? "");
  const [customerEmail, setCustomerEmail] = useState(
    defaultCustomer?.email ?? "",
  );

  const orderType =
    fulfillmentMode === "delivery" ? OrderType.DELIVERY : OrderType.TAKEAWAY;
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    onlinePaymentEnabled ? PaymentMethod.ONLINE : PaymentMethod.CASH,
  );

  const [error, setError] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>();
  const [clientSecret, setClientSecret] = useState<string>();
  const [orderId, setOrderId] = useState<string>();
  const [success, setSuccess] = useState<OrderStatusInfo>();
  const [loyaltyRewards, setLoyaltyRewards] = useState<LoyaltyRewardDTO[]>([]);
  const [loyaltyBalance, setLoyaltyBalance] =
    useState<LoyaltyBalanceDTO | null>(null);
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);
  const [rewardChoice, setRewardChoice] = useState<LoyaltyRewardDTO | null>(
    null,
  );

  const loyaltyBalanceWithHold = useMemo(() => {
    if (!loyaltyBalance) return null;
    return {
      ...loyaltyBalance,
      available: Math.max(0, loyaltyBalance.balance - pointsHeld),
    };
  }, [loyaltyBalance, pointsHeld]);

  const selectedRewardCount = useMemo(
    () =>
      loyaltyRewards.reduce(
        (sum, reward) => sum + rewardQuantity(reward.id),
        0,
      ),
    [loyaltyRewards, rewardQuantity],
  );

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoyaltyLoading(true);
    void fetchStoreLoyalty(storeId).then((data) => {
      if (cancelled) return;
      setLoyaltyRewards(data.rewards);
      setLoyaltyBalance(data.balance);
      setLoyaltyLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [open, storeId, signedIn]);

  function handleAddReward(reward: LoyaltyRewardDTO) {
    if (!signedIn || !loyaltyBalance) {
      toast.error("Pre uplatnenie odmien sa prihlás.");
      return;
    }
    if (pointsHeld + reward.pointsCost > loyaltyBalance.balance) {
      toast.error("Nemáš dostatok bodov.");
      return;
    }
    if (reward.requiresVariantChoice) {
      if (!reward.variantChoiceReady) {
        toast.error(
          "Veľkosti nie sú dostupné v tejto predajni. V admin/menu pridaj veľkosti (S/M/L…) a označ ich ako dostupné.",
        );
        return;
      }
      setRewardChoice(reward);
      return;
    }
    if (reward.choiceGroups.length > 0) {
      setRewardChoice(reward);
      return;
    }
    addReward(reward);
    showCartAddedToast(reward.name);
  }

  function handleConfirmRewardChoice(choices: CartChoice[]) {
    if (!rewardChoice) return;
    addReward(rewardChoice, choices);
    showCartAddedToast(rewardChoice.name);
    setRewardChoice(null);
  }

  function handleSetQuantity(lineId: string, quantity: number) {
    const line = lines.find((l) => l.lineId === lineId);
    if (line?.isLoyaltyReward && line.pointsCost && loyaltyBalance) {
      const otherHeld = pointsHeld - line.pointsCost * line.quantity;
      const maxQty = Math.floor(
        (loyaltyBalance.balance - otherHeld) / line.pointsCost,
      );
      setQuantity(lineId, Math.min(quantity, Math.max(0, maxQty)));
      return;
    }
    setQuantity(lineId, quantity);
  }

  function handleSignInSuccess(customer: { name?: string; email: string }) {
    setSignedIn(true);
    if (customer.name) setCustomerName(customer.name);
    setCustomerEmail(customer.email);
    router.refresh();
  }

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
      } else if (view === "rewards") {
        setView("cart");
      }
    }
  }

  const deliveryFee =
    fulfillmentMode === "delivery" && delivery.fee != null ? delivery.fee : 0;
  const grandTotal = subtotal + deliveryFee;
  const cartPaidSubtotal = paidSubtotal(lines);
  const cartHasLoyalty = hasLoyaltyRewards(lines);
  const loyaltyCheckoutBlocked =
    cartHasLoyalty &&
    (!signedIn || cartPaidSubtotal < LOYALTY_MIN_PAID_SUBTOTAL);
  const checkoutBlocked =
    fulfillmentMode === "delivery"
      ? delivery.fee == null || !!delivery.error
      : !delivery.quoteAttempted;
  const needsFulfillmentSetup =
    lines.length > 0 && checkoutBlocked && !delivery.pending;
  const fulfillmentSetupLabel =
    fulfillmentMode === "pickup"
      ? "Doplniť lokalitu"
      : delivery.error
        ? "Upraviť adresu"
        : "Doplniť adresu";

  function handleRequestFulfillmentSetup() {
    setOpen(false);
    requestFulfillmentSetup();
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
      deliveryAddress:
        orderType === OrderType.DELIVERY ? delivery.address : undefined,
      deliveryLat:
        orderType === OrderType.DELIVERY ? deliveryCoords?.lat : undefined,
      deliveryLng:
        orderType === OrderType.DELIVERY ? deliveryCoords?.lng : undefined,
      items: lines.map((l) => ({
        menuItemId: l.menuItemId,
        quantity: l.quantity,
        choices: l.choices.map((c) => ({
          groupId: c.groupId,
          menuItemId: c.menuItemId,
        })),
        ...(l.isLoyaltyReward && l.loyaltyRewardId
          ? { loyaltyRewardId: l.loyaltyRewardId }
          : {}),
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
        router.refresh();
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
      router.refresh();
      setView("success");
    });
  }

  return (
    <>
      <LoyaltyRewardChoiceDialog
        reward={rewardChoice}
        onClose={() => setRewardChoice(null)}
        onConfirm={handleConfirmRewardChoice}
      />
      <Sheet open={open} onOpenChange={resetOnClose}>
      <SheetTrigger asChild>
        <Button
          size="lg"
          variant="outline"
          className="fixed bottom-5 right-5 z-40 h-auto gap-3 border-2 border-foreground bg-white px-4 py-3 text-base font-semibold text-foreground shadow-lg hover:bg-white hover:text-foreground"
        >
          <span className="relative shrink-0">
            <ShoppingCart className="size-6 text-foreground" />
            <span
              className={cn(
                "absolute -right-2.5 -top-1 flex size-5 min-w-5 items-center justify-center rounded-full text-[11px] font-bold leading-none text-white",
                totalQuantity > 0 ? "bg-red-500" : "bg-foreground",
              )}
              suppressHydrationWarning
            >
              {totalQuantity}
            </span>
          </span>
          <span className="tabular-nums text-lg" suppressHydrationWarning>
            {formatMoney(grandTotal, currency)}
          </span>
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        showCloseButton={false}
        className="flex w-full flex-col gap-0 p-0 sm:max-w-full"
      >
        <SheetHeader className="border-b-2 border-primary">
          <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {(view === "checkout" || view === "payment") && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() =>
                    setView(view === "payment" ? "checkout" : "cart")
                  }
                  disabled={pending}
                >
                  <ArrowLeft className="size-4" />
                  <span className="sr-only">Späť</span>
                </Button>
              )}
              <SheetTitle className="text-lg">
                {view === "rewards" && "Odmeny"}
                {view === "cart" && "Košík"}
                {view === "checkout" && "Údaje a platba"}
                {view === "payment" && "Platba kartou"}
                {view === "success" && "Objednávka prijatá"}
              </SheetTitle>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {view === "rewards" ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-foreground bg-background hover:bg-accent"
                  onClick={() => setView("cart")}
                  aria-label="Späť do košíka"
                >
                  <X className="size-5" />
                </Button>
              ) : (
                <SheetCloseButton />
              )}
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="mx-auto w-full max-w-2xl">
            {view === "rewards" && (
              <LoyaltyRewardsPanel
                rewards={loyaltyRewards}
                balance={loyaltyBalanceWithHold}
                pointsHeld={pointsHeld}
                loading={loyaltyLoading}
                isAuthed={signedIn}
                rewardQuantity={rewardQuantity}
                onSignInSuccess={handleSignInSuccess}
                onSelectReward={handleAddReward}
              />
            )}

            {view === "cart" && (
              <CartView
                currency={currency}
                lines={lines}
                pointsBalance={loyaltyBalance?.balance ?? 0}
                pointsHeld={pointsHeld}
                setQuantity={handleSetQuantity}
                remove={remove}
                onOpenRewards={() => setView("rewards")}
                deliveryFee={
                  fulfillmentMode === "delivery" && delivery.fee != null
                    ? delivery.fee
                    : null
                }
                deliveryDistanceKm={
                  fulfillmentMode === "delivery" ? delivery.distanceKm : null
                }
                deliveryDurationMinutes={
                  fulfillmentMode === "delivery"
                    ? delivery.durationMinutes
                    : null
                }
                deliveryAddress={
                  fulfillmentMode === "delivery" ? delivery.address : null
                }
                deliveryError={
                  fulfillmentMode === "delivery" ? delivery.error : null
                }
              />
            )}

            {view === "checkout" && (
              <div className="space-y-6">
                <FormMessage message={error} />

                {cartHasLoyalty && !signedIn && (
                  <CartSignInBanner onSuccess={handleSignInSuccess} />
                )}

                {cartHasLoyalty &&
                  signedIn &&
                  cartPaidSubtotal < LOYALTY_MIN_PAID_SUBTOTAL && (
                    <p className="rounded-lg border-2 border-primary bg-amber-50 px-4 py-3 text-sm font-medium">
                      Pre uplatnenie odmien musíš mať v košíku jedlo za
                      minimálne {LOYALTY_MIN_PAID_SUBTOTAL} € (bez donášky).
                    </p>
                  )}

                {!signedIn && !cartHasLoyalty && (
                  <CartSignInBanner onSuccess={handleSignInSuccess} />
                )}

                <form
                  id="checkout-form"
                  action={handlePlaceOrder}
                  className="space-y-6"
                >
                <div className="grid gap-8 md:grid-cols-2">
                  <section className="space-y-4">
                    <CheckoutSectionHeader
                      icon={User}
                      title="Informácie zákazníka"
                    />

                    <div className="space-y-2">
                      <Label htmlFor="customerName">Meno</Label>
                      <Input
                        id="customerName"
                        name="customerName"
                        placeholder="Tvoje meno"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        autoComplete="name"
                      />
                      <FieldError messages={fieldErrors?.customerName} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customerEmail">E-mail</Label>
                      <Input
                        id="customerEmail"
                        name="customerEmail"
                        type="email"
                        placeholder="email@example.com"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
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

                    {fulfillmentMode === "delivery" && (
                      <FieldError messages={fieldErrors?.deliveryAddress} />
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="note">Poznámka</Label>
                      <Textarea
                        id="note"
                        name="note"
                        rows={2}
                        placeholder="Napr. bez cibule…"
                      />
                    </div>
                  </section>

                  <section className="space-y-4">
                    <CheckoutSectionHeader
                      icon={CreditCard}
                      title="Spôsob platby"
                    />

                    <fieldset className="space-y-2">
                      <Label>Zvoľte spôsob platby</Label>
                      {onlinePaymentEnabled && (
                        <PaymentOption
                          checked={paymentMethod === PaymentMethod.ONLINE}
                          onSelect={() =>
                            setPaymentMethod(PaymentMethod.ONLINE)
                          }
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
                  </section>
                </div>
              </form>
              </div>
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
                            
        {(view === "cart" ||
          view === "rewards" ||
          view === "checkout" ||
          view === "success") && (
          <div className="border-t-2 border-primary bg-yellow-400">
            <div className="mx-auto w-full max-w-2xl space-y-2 p-4">
              <div className="flex items-center justify-between gap-4">
              {view === "rewards" && signedIn ? (
                <LoyaltySelectedSummary
                  selectedCount={selectedRewardCount}
                  pointsHeld={pointsHeld}
                />
              ) : view !== "success" && view !== "rewards" ? (
                <div className="flex items-baseline gap-3">
                  <span className="text-xl font-bold">Spolu</span>
                  <span className="text-2xl font-bold tabular-nums">
                    {formatMoney(grandTotal, currency)}
                  </span>
                </div>
              ) : (
                <div />
              )}

              {view === "rewards" && (
                <Button
                  className="ml-auto shrink-0 px-8"
                  size="lg"
                  onClick={() => setView("cart")}
                >
                  Pokračovať
                </Button>
              )}

              {view === "cart" && (
                needsFulfillmentSetup ? (
                  <Button
                    className="shrink-0 px-8"
                    size="lg"
                    onClick={handleRequestFulfillmentSetup}
                  >
                    {fulfillmentSetupLabel}
                  </Button>
                ) : (
                  <Button
                    className="shrink-0 px-8"
                    size="lg"
                    disabled={lines.length === 0 || checkoutBlocked}
                    onClick={() => {
                      setError(undefined);
                      setView("checkout");
                    }}
                  >
                    {delivery.pending && lines.length > 0
                      ? "Počítam cenu…"
                      : "Pokračovať"}
                  </Button>
                )
              )}

              {view === "checkout" && (
                <Button
                  type="submit"
                  form="checkout-form"
                  className="shrink-0 px-8"
                  size="lg"
                  disabled={
                    pending ||
                    lines.length === 0 ||
                    checkoutBlocked ||
                    loyaltyCheckoutBlocked
                  }
                >
                  {pending
                    ? "Spracúvam…"
                    : paymentMethod === PaymentMethod.ONLINE
                      ? "Zaplatiť"
                      : "Objednať"}
                </Button>
              )}

              {view === "success" && (
                <Button
                  className="shrink-0 px-8"
                  size="lg"
                  onClick={() => resetOnClose(false)}
                >
                  Hotovo
                </Button>
              )}
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
    </>
  );
}

function CartView({
  currency,
  lines,
  pointsBalance,
  pointsHeld,
  setQuantity,
  remove,
  onOpenRewards,
  deliveryFee,
  deliveryAddress,
  deliveryDistanceKm,
  deliveryDurationMinutes,
  deliveryError,
}: {
  currency: string;
  lines: CartLine[];
  pointsBalance: number;
  pointsHeld: number;
  setQuantity: (lineId: string, quantity: number) => void;
  remove: (lineId: string) => void;
  onOpenRewards: () => void;
  deliveryFee: number | null;
  deliveryAddress: string | null;
  deliveryDistanceKm: number | null;
  deliveryDurationMinutes: number | null;
  deliveryError: string | null;
}) {
  const isEmpty = lines.length === 0 && deliveryFee == null;

  return (
    <ul className="">
      <AddRewardRow onOpen={onOpenRewards} />
      {isEmpty ? (
        <li className="flex flex-col items-center gap-3 py-16 text-center font-bold">
          <ShoppingCart className="size-10" />
          <p className="mt-6 text-2xl">Košík je prázdny</p>
        </li>
      ) : (
        <>
      {lines.map((line) => {
        const isReward = line.isLoyaltyReward && line.pointsCost;
        const otherHeld = isReward
          ? pointsHeld - line.pointsCost! * line.quantity
          : 0;
        const maxRewardQty = isReward
          ? Math.floor((pointsBalance - otherHeld) / line.pointsCost!)
          : 99;
        const canIncrease = !isReward || line.quantity < maxRewardQty;

        return (
        <li key={line.lineId} className="flex gap-4 py-4 border-b-2 border-primary">
          <div className="relative size-20 shrink-0 overflow-hidden border-2 border-primary">
            {line.imageUrl ? (
              <Image
                src={line.imageUrl}
                alt={line.name}
                fill
                sizes="80px"
                className="object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center">
                <ImageIcon className="size-7 text-muted-foreground" />
              </div>
            )}
            {isReward && (
              <span className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-0.5 bg-primary/90 py-0.5 text-[10px] font-bold text-white">
                <Gift className="size-3" />
                Odmena
              </span>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="text-lg font-semibold leading-snug">{line.name}</p>
              {isReward ? (
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {line.pointsCost! * line.quantity} bodov
                  {line.choices.length > 0
                    ? ` · ${line.choices.map((c) => c.name).join(", ")}`
                    : ""}
                </p>
              ) : line.choices.length > 0 ? (
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {formatMoney(line.price, currency)}, {line.choices.map((c) => c.name).join(", ")}
                </p>
              ) : null}
            </div>

            <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end sm:gap-4">
              <div className="flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-10"
                  onClick={() => setQuantity(line.lineId, line.quantity - 1)}
                >
                  <Minus className="size-6" />
                </Button>
                <span className="min-w-8 text-center text-lg font-semibold tabular-nums">
                  {line.quantity}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-10"
                  disabled={!canIncrease}
                  onClick={() => setQuantity(line.lineId, line.quantity + 1)}
                >
                  <Plus className="size-6" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold tabular-nums min-w-20 text-right">
                  {isReward
                    ? formatMoney(0, currency)
                    : formatMoney(line.price * line.quantity, currency)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-10 text-muted-foreground hover:text-destructive"
                  onClick={() => remove(line.lineId)}
                >
                  <Trash2 className="size-5" />
                  <span className="sr-only">Odstrániť</span>
                </Button>
              </div>
            </div>
          </div>
        </li>
        );
      })}
      {deliveryFee != null && (
        <li className="flex gap-4 py-4">
          <div className="relative size-20 shrink-0 overflow-hidden border-2 border-primary">
            <Image
              src="/couriermoto.webp"
              alt="Donáška"
              fill
              sizes="80px"
              className="object-cover"
            />
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="text-lg font-semibold leading-snug">Donáška</p>
              {deliveryAddress && (
                <p className="mt-0.5 text-sm leading-snug">{deliveryAddress}</p>
              )}
              {deliveryDistanceKm != null && (
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {deliveryDistanceKm} km
                  {deliveryDurationMinutes != null &&
                    `, ${formatDeliveryDuration(deliveryDurationMinutes)}`}
                </p>
              )}
              {deliveryError && (
                <p className="mt-0.5 text-sm text-destructive">{deliveryError}</p>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <span className="text-lg font-semibold tabular-nums">
                {formatMoney(deliveryFee, currency)}
              </span>
              <div className="size-10 shrink-0" aria-hidden />
            </div>
          </div>
        </li>
      )}
        </>
      )}
    </ul>
  );
}

function AddRewardRow({ onOpen }: { onOpen: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full gap-4 py-4 text-left border-b-2 border-primary"
      >
        <div className="relative size-20 shrink-0 overflow-hidden border-2 border-primary">
          <div className="flex size-full items-center justify-center">
            <Gift className="size-7 text-muted-foreground" />
          </div>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
          <p className="min-w-0 flex-1 text-lg font-semibold leading-snug">
            Pridaj odmenu
          </p>
          <span className="flex size-10 shrink-0 items-center justify-center">
            <Plus className="size-6" />
          </span>
        </div>
      </button>
    </li>
  );
}

function CheckoutSectionHeader({
  icon: Icon,
  title,
}: {
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div className="mb-2 flex items-center gap-4 py-12">
      <Icon className="size-8 text-primary" strokeWidth={1.5} />
      <h2 className="text-md font-bold">{title}</h2>
    </div>
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
