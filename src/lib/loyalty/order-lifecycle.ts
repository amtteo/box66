import "server-only";

import { LoyaltyTxType } from "@/generated/prisma/enums";
import { getOrCreateLoyaltyAccount } from "@/lib/loyalty/ledger";
import { pointsFromSubtotal, proportionalPoints } from "@/lib/loyalty/points";
import type { TxClient } from "@/lib/orders/stock";

type OrderLoyaltyItem = {
  isLoyaltyReward: boolean;
  lineTotal: { toString(): string } | number;
};

export type OrderLoyaltyContext = {
  id: string;
  storeId: string;
  customerId: string | null;
  items: OrderLoyaltyItem[];
};

function paidSubtotalFromItems(items: OrderLoyaltyItem[]): number {
  return items
    .filter((i) => !i.isLoyaltyReward)
    .reduce((sum, i) => sum + Number(i.lineTotal), 0);
}

async function netPointsForOrder(
  tx: TxClient,
  orderId: string,
  types: LoyaltyTxType[],
): Promise<number> {
  const rows = await tx.loyaltyTransaction.findMany({
    where: { orderId, type: { in: types } },
    select: { points: true },
  });
  return rows.reduce((sum, r) => sum + r.points, 0);
}

async function getLoyaltyAccountId(
  tx: TxClient,
  profileId: string,
  storeId: string,
): Promise<string | null> {
  const account = await tx.loyaltyAccount.findUnique({
    where: { profileId_storeId: { profileId, storeId } },
    select: { id: true },
  });
  return account?.id ?? null;
}

/**
 * Pripíše body pri dokončení objednávky (iba platené jedlo, floor).
 * Idempotentné — druhý prechod na COMPLETED nič nepridá.
 */
export async function awardLoyaltyOnCompleted(
  tx: TxClient,
  order: OrderLoyaltyContext,
): Promise<void> {
  if (!order.customerId) return;

  const existingEarn = await tx.loyaltyTransaction.findFirst({
    where: { orderId: order.id, type: LoyaltyTxType.EARN },
    select: { id: true },
  });
  if (existingEarn) return;

  const paidSubtotal = paidSubtotalFromItems(order.items);
  const points = pointsFromSubtotal(paidSubtotal);
  if (points <= 0) return;

  const account = await getOrCreateLoyaltyAccount(
    tx,
    order.customerId,
    order.storeId,
  );

  await tx.loyaltyAccount.update({
    where: { id: account.id },
    data: { balance: { increment: points } },
  });

  await tx.loyaltyTransaction.create({
    data: {
      accountId: account.id,
      type: LoyaltyTxType.EARN,
      points,
      orderId: order.id,
    },
  });
}

export type ReverseLoyaltyOptions = {
  /** Plný refund ak nie je zadané. Pri čiastočnom refunde proporcionálne storno EARN. */
  refundedSubtotal?: number;
};

/** Vráti uplatnené body (zvyšok REDEEM po predchádzajúcich reversáloch). */
async function reverseRedeemedPoints(
  tx: TxClient,
  order: OrderLoyaltyContext,
): Promise<void> {
  if (!order.customerId) return;

  const netRedeemed = await netPointsForOrder(tx, order.id, [
    LoyaltyTxType.REDEEM,
    LoyaltyTxType.REDEEM_REVERSAL,
  ]);
  if (netRedeemed >= 0) return;

  const toReturn = -netRedeemed;
  const accountId = await getLoyaltyAccountId(
    tx,
    order.customerId,
    order.storeId,
  );
  if (!accountId) return;

  await tx.loyaltyAccount.update({
    where: { id: accountId },
    data: { balance: { increment: toReturn } },
  });

  await tx.loyaltyTransaction.create({
    data: {
      accountId,
      type: LoyaltyTxType.REDEEM_REVERSAL,
      points: toReturn,
      orderId: order.id,
    },
  });
}

/** Stornuje pripísané body (zvyšok EARN po predchádzajúcich reversáloch). */
async function reverseEarnedPoints(
  tx: TxClient,
  order: OrderLoyaltyContext,
  options?: ReverseLoyaltyOptions,
): Promise<void> {
  if (!order.customerId) return;

  const earnRow = await tx.loyaltyTransaction.findFirst({
    where: { orderId: order.id, type: LoyaltyTxType.EARN },
    select: { points: true },
  });
  if (!earnRow || earnRow.points <= 0) return;

  const paidSubtotal = paidSubtotalFromItems(order.items);
  const reversalSum = await netPointsForOrder(tx, order.id, [
    LoyaltyTxType.EARN_REVERSAL,
  ]);
  const netEarned = earnRow.points + reversalSum;
  if (netEarned <= 0) return;

  let toReverse = netEarned;
  if (options?.refundedSubtotal != null && paidSubtotal > 0) {
    const targetReversed = proportionalPoints(
      earnRow.points,
      paidSubtotal,
      options.refundedSubtotal,
    );
    toReverse = Math.max(0, Math.min(netEarned, targetReversed + reversalSum));
  }

  if (toReverse <= 0) return;

  const account = await tx.loyaltyAccount.findUnique({
    where: {
      profileId_storeId: {
        profileId: order.customerId,
        storeId: order.storeId,
      },
    },
    select: { id: true, balance: true },
  });
  if (!account) return;

  const decrement = Math.min(toReverse, account.balance);

  await tx.loyaltyAccount.update({
    where: { id: account.id },
    data: { balance: { decrement } },
  });

  await tx.loyaltyTransaction.create({
    data: {
      accountId: account.id,
      type: LoyaltyTxType.EARN_REVERSAL,
      points: -decrement,
      orderId: order.id,
    },
  });
}

/** Zrušená objednávka — vráti uplatnené body. */
export async function reverseLoyaltyOnCancelled(
  tx: TxClient,
  order: OrderLoyaltyContext,
): Promise<void> {
  await reverseRedeemedPoints(tx, order);
}

/** Refund — stornuje pripísané body a vráti uplatnené. */
export async function reverseLoyaltyOnRefunded(
  tx: TxClient,
  order: OrderLoyaltyContext,
  options?: ReverseLoyaltyOptions,
): Promise<void> {
  await reverseEarnedPoints(tx, order, options);
  await reverseRedeemedPoints(tx, order);
}
