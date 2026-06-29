import "server-only";

import { LoyaltyTxType, PendingInviteStatus } from "@/generated/prisma/enums";
import { getOrCreateLoyaltyAccount } from "@/lib/loyalty/ledger";
import { prisma } from "@/lib/prisma";
import type { TxClient } from "@/lib/orders/stock";

/**
 * Zlúči dočasné body podľa telefónu do účtu zákazníka a doplní customerId na objednávkach.
 * Idempotentné — bezpečné volať viackrát.
 */
export async function mergePendingInviteForProfile(
  profileId: string,
  phone: string,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const invite = await tx.pendingCustomerInvite.findFirst({
      where: {
        phone,
        status: PendingInviteStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
    });

    const phoneAccounts = await tx.phoneLoyaltyAccount.findMany({
      where: { phone },
    });

    for (const phoneAccount of phoneAccounts) {
      if (phoneAccount.balance <= 0) {
        await tx.phoneLoyaltyTransaction.deleteMany({
          where: { accountId: phoneAccount.id },
        });
        await tx.phoneLoyaltyAccount.delete({ where: { id: phoneAccount.id } });
        continue;
      }

      const loyaltyAccount = await getOrCreateLoyaltyAccount(
        tx as TxClient,
        profileId,
        phoneAccount.storeId,
      );

      await tx.loyaltyAccount.update({
        where: { id: loyaltyAccount.id },
        data: { balance: { increment: phoneAccount.balance } },
      });

      await tx.loyaltyTransaction.create({
        data: {
          accountId: loyaltyAccount.id,
          type: LoyaltyTxType.EARN,
          points: phoneAccount.balance,
          note: `Zlúčenie bodov z telefónu ${phone}`,
        },
      });

      await tx.phoneLoyaltyTransaction.deleteMany({
        where: { accountId: phoneAccount.id },
      });
      await tx.phoneLoyaltyAccount.delete({ where: { id: phoneAccount.id } });
    }

    await tx.order.updateMany({
      where: {
        customerPhone: phone,
        customerId: null,
      },
      data: { customerId: profileId },
    });

    if (invite) {
      await tx.pendingCustomerInvite.update({
        where: { id: invite.id },
        data: {
          status: PendingInviteStatus.COMPLETED,
          profileId,
        },
      });
    }

    await tx.profile.update({
      where: { id: profileId },
      data: { phone },
    });
  });
}

/** Po prihlásení — skúsi zlúčiť pozvánku podľa telefónu v profile. */
export async function tryMergePendingInviteForProfile(
  profileId: string,
): Promise<void> {
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    select: { phone: true },
  });
  if (!profile?.phone) return;
  await mergePendingInviteForProfile(profileId, profile.phone);
}
