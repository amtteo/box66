"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getUser, requireProfile } from "@/lib/auth/dal";
import { Role } from "@/lib/rbac";
import { authorizeStore } from "@/lib/auth/tenancy";
import { getStripe, isStripeConfigured } from "@/lib/stripe/server";
import { isUniqueViolation } from "@/lib/forms";
import {
  OrderStatus,
  OrderType,
  PaymentMethod,
  PaymentStatus,
} from "@/generated/prisma/enums";
import { CheckoutSchema, ORDER_STATUS_FLOW, defaultRestoreStock, orderHadStockDeducted } from "@/lib/orders/schemas";
import { computeDeliveryForStore } from "@/lib/delivery/compute";
import { estimatedDeliveryMinutes } from "@/lib/delivery/format";
import { resolveMenuItemPrice, toNumber } from "@/lib/pricing/resolve";
import {
  deductStockForOrder,
  reverseStockForOrder,
  type OrderLine,
  type TxClient,
} from "@/lib/orders/stock";
import {
  resolveLoyaltyCartItem,
  validateLoyaltyCheckout,
} from "@/lib/loyalty/checkout";
import {
  InsufficientLoyaltyPointsError,
  redeemLoyaltyPoints,
} from "@/lib/loyalty/ledger";
import {
  awardLoyaltyOnCompleted,
  reverseLoyaltyOnCancelled,
  reverseLoyaltyOnRefunded,
} from "@/lib/loyalty/order-lifecycle";

const ADMIN_ORDERS_PATH = "/admin/objednavky";
const ADMIN_STOCK_PATH = "/admin/sklad";

export type PlaceOrderResult =
  | {
      ok: true;
      orderId: string;
      orderNumber: number;
      /** Vyplnené pri online platbe — pre Stripe Embedded Checkout. */
      clientSecret?: string;
    }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Pridelí ďalšie poradové číslo objednávky v rámci predajne (transakčne). */
async function nextOrderNumber(tx: TxClient, storeId: string): Promise<number> {
  const last = await tx.order.findFirst({
    where: { storeId },
    orderBy: { orderNumber: "desc" },
    select: { orderNumber: true },
  });
  return (last?.orderNumber ?? 0) + 1;
}

/**
 * Vytvorí objednávku z košíka na úvodnej stránke. Ceny sa prepočítavajú na
 * serveri z `MenuItem` (klientovi sa nedôveruje). Sklad sa NEodpočítava —
 * odpočet prebehne až pri potvrdení objednávky v admine. Pri online platbe
 * vytvorí Stripe Embedded Checkout session a vráti `clientSecret`.
 */
export async function placeOrder(
  input: unknown,
): Promise<PlaceOrderResult> {
  const parsed = CheckoutSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      (fieldErrors[key] ??= []).push(issue.message);
    }
    return { ok: false, message: "Skontroluj zadané údaje.", fieldErrors };
  }
  const data = parsed.data;

  if (data.paymentMethod === PaymentMethod.ONLINE && !isStripeConfigured()) {
    return {
      ok: false,
      message:
        "Online platba kartou nie je momentálne dostupná. Vyber platbu v hotovosti pri prevzatí.",
    };
  }

  const store = await prisma.store.findFirst({
    where: { id: data.storeId, isActive: true },
    select: {
      id: true,
      currency: true,
      priceCoefficient: { select: { multiplier: true } },
    },
  });
  if (!store) {
    return { ok: false, message: "Predajňa nie je dostupná." };
  }

  const priceMultiplier = Number(store.priceCoefficient.multiplier);

  const loyaltyCartItems = data.items.filter((i) => i.loyaltyRewardId);
  const regularCartItems = data.items.filter((i) => !i.loyaltyRewardId);
  const hasLoyaltyItems = loyaltyCartItems.length > 0;

  // Načítaj iba dostupné položky menu danej predajne a prepočítaj ceny.
  const menuItemIds = [...new Set(data.items.map((i) => i.menuItemId))];
  const menuItems = await prisma.menuItem.findMany({
    where: {
      id: { in: menuItemIds },
      storeId: store.id,
      isAvailable: true,
      product: { isActive: true },
    },
    select: {
      id: true,
      customPrice: true,
      productId: true,
      product: {
        select: {
          name: true,
          basePrice: true,
          choiceGroups: {
            select: {
              id: true,
              label: true,
              categoryId: true,
              minSelect: true,
              maxSelect: true,
            },
          },
        },
      },
    },
  });
  const byId = new Map(menuItems.map((m) => [m.id, m]));

  // Pool kategórie použité vo vybraných kombo produktoch.
  const poolCategoryIds = new Set<string>();
  for (const mi of menuItems) {
    for (const g of mi.product.choiceGroups) poolCategoryIds.add(g.categoryId);
  }

  // Dostupné možnosti výberu v predajni (menuItemId -> produkt/kategória).
  type OptionInfo = { productId: string; name: string; categoryId: string };
  const optionByMenuItemId = new Map<string, OptionInfo>();
  const optionIdsByCategory = new Map<string, Set<string>>();
  if (poolCategoryIds.size > 0) {
    const optionItems = await prisma.menuItem.findMany({
      where: {
        storeId: store.id,
        isAvailable: true,
        product: {
          isActive: true,
          isComboOption: true,
          categoryId: { in: [...poolCategoryIds] },
        },
      },
      select: {
        id: true,
        product: { select: { id: true, name: true, categoryId: true } },
      },
    });
    for (const oi of optionItems) {
      optionByMenuItemId.set(oi.id, {
        productId: oi.product.id,
        name: oi.product.name,
        categoryId: oi.product.categoryId,
      });
      const set = optionIdsByCategory.get(oi.product.categoryId) ?? new Set();
      set.add(oi.id);
      optionIdsByCategory.set(oi.product.categoryId, set);
    }
  }

  type ResolvedChoice = {
    groupId: string;
    groupLabel: string;
    productId: string;
    menuItemId: string;
    nameSnapshot: string;
  };
  type BuiltOrderLine = {
    menuItemId: string;
    productId: string;
    nameSnapshot: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
    note: string | null;
    choices: ResolvedChoice[];
    isLoyaltyReward?: boolean;
    pointsRedeemed?: number;
    loyaltyRewardId?: string;
  };

  const orderLines: BuiltOrderLine[] = [];
  for (const item of regularCartItems) {
    const mi = byId.get(item.menuItemId);
    if (!mi) {
      return {
        ok: false,
        message:
          "Niektoré položky už nie sú dostupné. Obnov stránku a skús to znova.",
      };
    }

    // Skupiny výberu, ktoré majú v tejto predajni aspoň jednu možnosť.
    const effectiveGroups = mi.product.choiceGroups.filter(
      (g) => (optionIdsByCategory.get(g.categoryId)?.size ?? 0) > 0,
    );
    const groupById = new Map(effectiveGroups.map((g) => [g.id, g]));

    // Spočítaj voľby podľa skupín a over platnosť každej voľby.
    const choicesByGroup = new Map<string, ResolvedChoice[]>();
    for (const ch of item.choices) {
      const group = groupById.get(ch.groupId);
      if (!group) {
        return {
          ok: false,
          message: "Neplatný výber pri položke. Obnov stránku a skús to znova.",
        };
      }
      const validIds = optionIdsByCategory.get(group.categoryId);
      const opt = optionByMenuItemId.get(ch.menuItemId);
      if (!validIds?.has(ch.menuItemId) || !opt) {
        return {
          ok: false,
          message: "Zvolená možnosť už nie je dostupná. Obnov stránku.",
        };
      }
      const list = choicesByGroup.get(group.id) ?? [];
      list.push({
        groupId: group.id,
        groupLabel: group.label,
        productId: opt.productId,
        menuItemId: ch.menuItemId,
        nameSnapshot: opt.name,
      });
      choicesByGroup.set(group.id, list);
    }

    // Over min/max pre každú povinnú skupinu.
    for (const group of effectiveGroups) {
      const count = choicesByGroup.get(group.id)?.length ?? 0;
      if (count < group.minSelect || count > group.maxSelect) {
        return {
          ok: false,
          message: `Pri „${mi.product.name}" treba dokončiť výber „${group.label}".`,
        };
      }
    }

    const resolvedChoices = [...choicesByGroup.values()].flat();
    const unitPrice = resolveMenuItemPrice({
      basePrice: toNumber(mi.product.basePrice),
      multiplier: priceMultiplier,
      customPrice: toNumber(mi.customPrice),
    });
    if (unitPrice == null) {
      return {
        ok: false,
        message: "Niektoré položky nemajú platnú cenu. Obnov stránku a skús to znova.",
      };
    }
    orderLines.push({
      menuItemId: mi.id,
      productId: mi.productId,
      nameSnapshot: mi.product.name,
      unitPrice,
      quantity: item.quantity,
      lineTotal: round2(unitPrice * item.quantity),
      note: item.note ?? null,
      choices: resolvedChoices,
    });
  }

  for (const item of loyaltyCartItems) {
    const resolved = await resolveLoyaltyCartItem(store.id, {
      ...item,
      loyaltyRewardId: item.loyaltyRewardId!,
    });
    if ("error" in resolved) {
      return { ok: false, message: resolved.error };
    }
    orderLines.push({
      menuItemId: resolved.menuItemId,
      productId: resolved.productId,
      nameSnapshot: resolved.nameSnapshot,
      unitPrice: 0,
      quantity: resolved.quantity,
      lineTotal: 0,
      note: item.note ?? null,
      choices: [],
      isLoyaltyReward: true,
      pointsRedeemed: resolved.pointsRedeemed,
      loyaltyRewardId: resolved.loyaltyRewardId,
    });
  }

  const subtotal = round2(
    orderLines.reduce((sum, l) => sum + l.lineTotal, 0),
  );
  const paidSubtotal = round2(
    orderLines
      .filter((l) => !l.isLoyaltyReward)
      .reduce((sum, l) => sum + l.lineTotal, 0),
  );

  const user = await getUser();
  const customerId = user
    ? (
        await prisma.profile.findUnique({
          where: { id: user.id },
          select: { id: true },
        })
      )?.id ?? null
    : null;

  const loyaltyValidation = validateLoyaltyCheckout({
    hasLoyaltyItems,
    paidSubtotal,
    customerId,
  });
  if (!loyaltyValidation.ok) {
    return { ok: false, message: loyaltyValidation.message };
  }

  const totalPointsToRedeem = orderLines.reduce(
    (sum, l) => sum + (l.pointsRedeemed ?? 0),
    0,
  );
  if (totalPointsToRedeem > 0 && customerId) {
    const balance = await prisma.loyaltyAccount.findUnique({
      where: {
        profileId_storeId: { profileId: customerId, storeId: store.id },
      },
      select: { balance: true },
    });
    if (!balance || balance.balance < totalPointsToRedeem) {
      return {
        ok: false,
        message: "Nemáš dostatok bodov na uplatnenie odmien.",
      };
    }
  }

  let deliveryFee = 0;
  let deliveryDistanceKm: number | null = null;
  let deliveryDurationMinutes: number | null = null;
  let deliveryAddress: string | null = null;
  let deliveryLatitude: number | null = null;
  let deliveryLongitude: number | null = null;

  if (data.type === OrderType.DELIVERY) {
    if (!data.deliveryAddress) {
      return {
        ok: false,
        message: "Pre donášku zadaj adresu doručenia.",
        fieldErrors: { deliveryAddress: ["Zadaj adresu doručenia."] },
      };
    }
    const deliveryCoords =
      data.deliveryLat != null && data.deliveryLng != null
        ? { lat: data.deliveryLat, lng: data.deliveryLng }
        : null;
    const delivery = await computeDeliveryForStore(
      store.id,
      data.deliveryAddress,
      deliveryCoords,
    );
    if (!delivery.ok) {
      return { ok: false, message: delivery.message };
    }
    deliveryFee = delivery.fee;
    deliveryDistanceKm = delivery.distanceKm;
    deliveryDurationMinutes = estimatedDeliveryMinutes(delivery.durationMinutes);
    deliveryAddress = data.deliveryAddress;
    deliveryLatitude = deliveryCoords?.lat ?? null;
    deliveryLongitude = deliveryCoords?.lng ?? null;
  }

  const total = round2(subtotal + deliveryFee);

  const redeemLines = orderLines
    .filter((l) => l.isLoyaltyReward && l.loyaltyRewardId && l.pointsRedeemed)
    .map((l) => ({
      rewardId: l.loyaltyRewardId!,
      points: l.pointsRedeemed!,
    }));

  // Vytvor objednávku + položky s pridelením poradového čísla (s retry pri kolízii).
  let created: { id: string; orderNumber: number } | null = null;
  for (let attempt = 0; attempt < 5 && !created; attempt++) {
    try {
      created = await prisma.$transaction(async (tx) => {
        const orderNumber = await nextOrderNumber(tx, store.id);
        const order = await tx.order.create({
          data: {
            orderNumber,
            storeId: store.id,
            customerId,
            type: data.type,
            status: OrderStatus.PENDING,
            paymentStatus: PaymentStatus.UNPAID,
            paymentMethod: data.paymentMethod,
            subtotal,
            deliveryFee,
            total,
            currency: store.currency,
            deliveryAddress,
            deliveryLatitude,
            deliveryLongitude,
            deliveryDistanceKm,
            deliveryDurationMinutes,
            customerName: data.customerName ?? null,
            customerEmail: data.customerEmail ?? null,
            customerPhone: data.customerPhone ?? null,
            note: data.note ?? null,
            items: {
              create: orderLines.map((l) => ({
                menuItemId: l.menuItemId,
                productId: l.productId,
                nameSnapshot: l.nameSnapshot,
                unitPrice: l.unitPrice,
                quantity: l.quantity,
                lineTotal: l.lineTotal,
                note: l.note,
                isLoyaltyReward: l.isLoyaltyReward ?? false,
                pointsRedeemed: l.pointsRedeemed ?? null,
                choices: {
                  create: l.choices.map((c) => ({
                    groupId: c.groupId,
                    productId: c.productId,
                    menuItemId: c.menuItemId,
                    groupLabel: c.groupLabel,
                    nameSnapshot: c.nameSnapshot,
                  })),
                },
              })),
            },
          },
          select: { id: true, orderNumber: true },
        });

        if (redeemLines.length > 0 && customerId) {
          await redeemLoyaltyPoints(tx, {
            profileId: customerId,
            storeId: store.id,
            orderId: order.id,
            lines: redeemLines,
          });
        }

        return order;
      });
    } catch (err) {
      if (err instanceof InsufficientLoyaltyPointsError) {
        return {
          ok: false,
          message: "Nemáš dostatok bodov na uplatnenie odmien.",
        };
      }
      if (isUniqueViolation(err)) continue; // kolízia orderNumber → skús znova
      console.error("[placeOrder] create failed:", err);
      return { ok: false, message: "Objednávku sa nepodarilo vytvoriť." };
    }
  }
  if (!created) {
    return { ok: false, message: "Objednávku sa nepodarilo vytvoriť." };
  }

  revalidatePath(ADMIN_ORDERS_PATH);

  // Platba v hotovosti — hotovo, čaká na potvrdenie obsluhou.
  if (data.paymentMethod === PaymentMethod.CASH) {
    return { ok: true, orderId: created.id, orderNumber: created.orderNumber };
  }

  // Online platba — vytvor Stripe Embedded Checkout session.
  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded_page",
      mode: "payment",
      redirect_on_completion: "never",
      line_items: [
        ...orderLines
          .filter((l) => l.unitPrice > 0)
          .map((l) => ({
          quantity: l.quantity,
          price_data: {
            currency: store.currency.toLowerCase(),
            unit_amount: Math.round(l.unitPrice * 100),
            product_data: {
              name:
                l.choices.length > 0
                  ? `${l.nameSnapshot} (${l.choices
                      .map((c) => c.nameSnapshot)
                      .join(", ")})`
                  : l.nameSnapshot,
            },
          },
        })),
        ...(deliveryFee > 0
          ? [
              {
                quantity: 1,
                price_data: {
                  currency: store.currency.toLowerCase(),
                  unit_amount: Math.round(deliveryFee * 100),
                  product_data: { name: "Donáška" },
                },
              },
            ]
          : []),
      ],
      metadata: { orderId: created.id, storeId: store.id },
      payment_intent_data: { metadata: { orderId: created.id } },
      ...(data.customerEmail ? { customer_email: data.customerEmail } : {}),
    });

    await prisma.order.update({
      where: { id: created.id },
      data: {
        stripeSessionId: session.id,
        paymentStatus: PaymentStatus.PROCESSING,
      },
    });

    return {
      ok: true,
      orderId: created.id,
      orderNumber: created.orderNumber,
      clientSecret: session.client_secret ?? undefined,
    };
  } catch (err) {
    console.error("[placeOrder] stripe session failed:", err);
    return {
      ok: false,
      message: "Platobnú reláciu sa nepodarilo vytvoriť. Skús to znova.",
    };
  }
}

export type OrderStatusInfo = {
  orderNumber: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
};

/**
 * Po dokončení Stripe Embedded Checkoutu overí stav platby priamo zo Stripe a
 * (idempotentne) označí objednávku ako zaplatenú. Funguje aj bez webhooku
 * (v deve), webhook ostáva autoritatívny pre produkciu.
 */
export async function finalizeCheckout(
  orderId: string,
): Promise<OrderStatusInfo | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentStatus: true,
      stripeSessionId: true,
    },
  });
  if (!order) return null;

  if (
    order.paymentStatus !== PaymentStatus.PAID &&
    order.stripeSessionId &&
    isStripeConfigured()
  ) {
    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(
        order.stripeSessionId,
      );
      if (session.payment_status === "paid") {
        const updated = await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: PaymentStatus.PAID,
            paymentMethod: PaymentMethod.ONLINE,
            stripePaymentIntentId:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : (session.payment_intent?.id ?? null),
          },
          select: { orderNumber: true, status: true, paymentStatus: true },
        });
        revalidatePath(ADMIN_ORDERS_PATH);
        return updated;
      }
    } catch (err) {
      console.error("[finalizeCheckout] retrieve failed:", err);
    }
  }

  return {
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
  };
}

/** Verejné minimálne čítanie stavu objednávky (pre obrazovku poďakovania). */
export async function getOrderStatus(
  orderId: string,
): Promise<OrderStatusInfo | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { orderNumber: true, status: true, paymentStatus: true },
  });
  return order;
}

export type UpdateStatusResult = { ok: true } | { ok: false; message: string };

export type UpdateOrderStatusOptions = {
  /** Pri zrušení/refundácii: vrátiť suroviny na sklad? (default podľa stavu objednávky) */
  restoreStock?: boolean;
  /** Pri čiastočnom refunde: suma vráteného jedla pre proporcionálne storno EARN bodov. */
  refundedSubtotal?: number;
};

/**
 * Posunie objednávku v životnom cykle (obsluha+). Pri PENDING→CONFIRMED
 * transakčne odpočíta sklad z receptúr. Pri zrušení/refundácii je vrátenie
 * skladu voliteľné (`restoreStock`). Pri online platbe refund vykoná Stripe.
 */
export async function updateOrderStatus(
  orderId: string,
  nextStatus: OrderStatus,
  options?: UpdateOrderStatusOptions,
): Promise<UpdateStatusResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      storeId: true,
      customerId: true,
      status: true,
      paymentStatus: true,
      paymentMethod: true,
      stripePaymentIntentId: true,
      items: {
        select: {
          productId: true,
          quantity: true,
          isLoyaltyReward: true,
          lineTotal: true,
          choices: { select: { productId: true } },
        },
      },
    },
  });
  if (!order) return { ok: false, message: "Objednávka neexistuje." };

  await authorizeStore(order.storeId, Role.STAFF);
  const profile = await requireProfile();

  const allowed = ORDER_STATUS_FLOW[order.status] ?? [];
  if (!allowed.includes(nextStatus)) {
    return { ok: false, message: "Tento prechod stavu nie je povolený." };
  }

  // Spotreba = produkt položky + každý vybraný produkt (kombo voľba), v množstve položky.
  const lines: OrderLine[] = [];
  for (const i of order.items) {
    lines.push({ productId: i.productId, quantity: i.quantity });
    for (const c of i.choices) {
      lines.push({ productId: c.productId, quantity: i.quantity });
    }
  }

  const stockWasDeducted = orderHadStockDeducted(order.status);
  const isReversal =
    nextStatus === OrderStatus.CANCELLED || nextStatus === OrderStatus.REFUNDED;
  const shouldRestoreStock =
    isReversal &&
    stockWasDeducted &&
    (options?.restoreStock ?? defaultRestoreStock(order.status));

  // Refund online platby cez Stripe (pred zmenou stavu, aby sme pri zlyhaní necúvli).
  let refundPaymentStatus: PaymentStatus | null = null;
  if (
    nextStatus === OrderStatus.REFUNDED &&
    order.paymentStatus === PaymentStatus.PAID &&
    order.stripePaymentIntentId
  ) {
    try {
      const stripe = getStripe();
      await stripe.refunds.create({
        payment_intent: order.stripePaymentIntentId,
      });
      refundPaymentStatus = PaymentStatus.REFUNDED;
    } catch (err) {
      console.error("[updateOrderStatus] refund failed:", err);
      return {
        ok: false,
        message: "Refundáciu cez Stripe sa nepodarilo vykonať.",
      };
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (nextStatus === OrderStatus.CONFIRMED) {
        await deductStockForOrder(tx, {
          storeId: order.storeId,
          orderId: order.id,
          lines,
          createdById: profile.id,
        });
      } else if (shouldRestoreStock) {
        await reverseStockForOrder(tx, {
          storeId: order.storeId,
          orderId: order.id,
          createdById: profile.id,
        });
      }

      const cashCollected =
        nextStatus === OrderStatus.COMPLETED &&
        order.paymentMethod === PaymentMethod.CASH &&
        order.paymentStatus === PaymentStatus.UNPAID;

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: nextStatus,
          ...(nextStatus === OrderStatus.COMPLETED
            ? { completedAt: new Date() }
            : {}),
          ...(refundPaymentStatus
            ? { paymentStatus: refundPaymentStatus }
            : cashCollected
              ? { paymentStatus: PaymentStatus.PAID }
              : {}),
        },
      });

      const loyaltyOrder = {
        id: order.id,
        storeId: order.storeId,
        customerId: order.customerId,
        items: order.items,
      };

      if (nextStatus === OrderStatus.COMPLETED) {
        await awardLoyaltyOnCompleted(tx, loyaltyOrder);
      } else if (nextStatus === OrderStatus.CANCELLED) {
        await reverseLoyaltyOnCancelled(tx, loyaltyOrder);
      } else if (nextStatus === OrderStatus.REFUNDED) {
        await reverseLoyaltyOnRefunded(tx, loyaltyOrder, {
          refundedSubtotal: options?.refundedSubtotal,
        });
      }
    });
  } catch (err) {
    if (err instanceof Error && err.message === "INSUFFICIENT_STOCK") {
      return {
        ok: false,
        message:
          "Na sklade nie je dosť surovín na potvrdenie objednávky. Doplň zásoby.",
      };
    }
    if (err instanceof Error && err.message === "UNIT_MISMATCH") {
      return {
        ok: false,
        message:
          "Nezhoda merných jednotiek v receptúre. Skontroluj receptúru a sklad.",
      };
    }
    console.error("[updateOrderStatus] failed:", err);
    return { ok: false, message: "Stav objednávky sa nepodarilo zmeniť." };
  }

  revalidatePath(ADMIN_ORDERS_PATH);
  if (nextStatus === OrderStatus.CONFIRMED || shouldRestoreStock) {
    revalidatePath(ADMIN_STOCK_PATH);
  }
  return { ok: true };
}
