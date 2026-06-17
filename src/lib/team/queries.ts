import "server-only";

import { prisma } from "@/lib/prisma";

/** Členovia organizácie (všetky členstvá) + profil a predajňa. */
export async function getOrgMembers(organizationId: string) {
  return prisma.membership.findMany({
    where: { organizationId },
    orderBy: [{ createdAt: "asc" }],
    include: {
      profile: { select: { id: true, email: true, fullName: true } },
      store: { select: { id: true, name: true } },
    },
  });
}

export type MemberRow = Awaited<ReturnType<typeof getOrgMembers>>[number];
