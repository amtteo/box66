import "server-only";

import { prisma } from "@/lib/prisma";
import { MembershipStatus, Role } from "@/generated/prisma/enums";

/** Všetky organizácie + počty predajní a členov (pre superadmin prehľad). */
export async function getOrganizations() {
  return prisma.organization.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    include: {
      _count: { select: { stores: true, memberships: true } },
      memberships: {
        where: { role: Role.ADMIN, status: MembershipStatus.ACTIVE },
        select: {
          id: true,
          profile: { select: { id: true, email: true, fullName: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export type OrganizationRow = Awaited<
  ReturnType<typeof getOrganizations>
>[number];
