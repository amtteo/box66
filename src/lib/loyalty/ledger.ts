import "server-only";

import { LoyaltyTxType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import type { TxClient } from "@/lib/orders/stock";

/** Získa alebo vytvorí účet bodov zákazníka v predajni. */
export async function getOrCreateLoyaltyAccount(
  tx: TxClient,
  profileId: string,
  storeId: string,
) {
  const existing = await tx.loyaltyAccount.findUnique({
    where: { profileId_storeId: { profileId, storeId } },
  });
  if (existing) return existing;

  return tx.loyaltyAccount.create({
    data: { profileId, storeId, balance: 0 },
  });
}

/** Aktuálny zostatok bodov (0 ak účet neexistuje). */
export async function getLoyaltyBalance(
  profileId: string,
  storeId: string,
): Promise<number> {
  const account = await prisma.loyaltyAccount.findUnique({
    where: { profileId_storeId: { profileId, storeId } },
    select: { balance: true },
  });
  return account?.balance ?? 0;
}

export class InsufficientLoyaltyPointsError extends Error {
  constructor() {
    super("INSUFFICIENT_LOYALTY_POINTS");
    this.name = "InsufficientLoyaltyPointsError";
  }
}

type RedeemLine = {
  rewardId: string;
  points: number;
};

/**
 * Odpočíta body za uplatnené odmeny v rámci transakcie objednávky.
 * Vyhodí `InsufficientLoyaltyPointsError`, ak zostatok nestačí.
 */
export async function redeemLoyaltyPoints(
  tx: TxClient,
  params: {
    profileId: string;
    storeId: string;
    orderId: string;
    lines: RedeemLine[];
  },
): Promise<void> {
  const total = params.lines.reduce((sum, l) => sum + l.points, 0);
  if (total <= 0) return;

  const account = await tx.loyaltyAccount.findUnique({
    where: {
      profileId_storeId: {
        profileId: params.profileId,
        storeId: params.storeId,
      },
    },
    select: { id: true, balance: true },
  });

  if (!account || account.balance < total) {
    throw new InsufficientLoyaltyPointsError();
  }

  await tx.loyaltyAccount.update({
    where: { id: account.id },
    data: { balance: { decrement: total } },
  });

  for (const line of params.lines) {
    await tx.loyaltyTransaction.create({
      data: {
        accountId: account.id,
        type: LoyaltyTxType.REDEEM,
        points: -line.points,
        orderId: params.orderId,
        rewardId: line.rewardId,
      },
    });
  }
}
