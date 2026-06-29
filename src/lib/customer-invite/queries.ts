import "server-only";

import { PendingInviteStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export async function getPendingInviteByToken(token: string) {
  return prisma.pendingCustomerInvite.findFirst({
    where: {
      token,
      status: PendingInviteStatus.PENDING,
      expiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      token: true,
      phone: true,
      fullName: true,
      storeId: true,
    },
  });
}
