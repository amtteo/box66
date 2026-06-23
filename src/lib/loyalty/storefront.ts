"use server";

import { getUser } from "@/lib/auth/dal";
import { getLoyaltyBalance } from "@/lib/loyalty/ledger";
import {
  getStoreLoyaltyRewards,
} from "@/lib/loyalty/queries";
import type { LoyaltyBalanceDTO, LoyaltyRewardDTO } from "@/lib/loyalty/types";

/** Verejné odmeny predajne + voliteľný zostatok prihláseného zákazníka. */
export async function fetchStoreLoyalty(
  storeId: string,
  cartPointsHeld = 0,
): Promise<{
  rewards: LoyaltyRewardDTO[];
  balance: LoyaltyBalanceDTO | null;
}> {
  const [rewards, user] = await Promise.all([
    getStoreLoyaltyRewards(storeId),
    getUser(),
  ]);

  if (!user) {
    return { rewards, balance: null };
  }

  const balance = await getLoyaltyBalance(user.id, storeId);
  const held = Math.max(0, cartPointsHeld);
  return {
    rewards,
    balance: {
      balance,
      available: Math.max(0, balance - held),
    },
  };
}
