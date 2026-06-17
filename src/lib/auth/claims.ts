import "server-only";

import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { MembershipStatus } from "@/generated/prisma/enums";
import type { Role } from "@/lib/rbac";

/**
 * Autorizačné nároky uložené do `app_metadata` v Supabase Auth.
 *
 * DÔLEŽITÉ: app_metadata je editovateľné len cez service-role (nie používateľom),
 * preto sem patria autorizačné dáta — NIKDY nie do `user_metadata`. Tieto nároky
 * slúžia len na OPTIMISTICKÉ kontroly (napr. v proxy/UI). Autoritatívna kontrola
 * vždy prebieha v DAL nad databázou (cez Prismu).
 */
export type AppClaims = {
  is_superadmin: boolean;
  /** Rola používateľa v rámci jednotlivých organizácií (len ACTIVE členstvá). */
  org_roles: Record<string, Role>;
};

/**
 * Prepočíta nároky z DB (profil + členstvá) a zapíše ich do `app_metadata`.
 * Volaj po každej zmene profilu/členstva (priradenie roly, pozvánka, …).
 */
export async function syncUserClaims(userId: string): Promise<AppClaims> {
  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: {
      isSuperAdmin: true,
      memberships: {
        where: { status: MembershipStatus.ACTIVE },
        select: { organizationId: true, role: true },
      },
    },
  });

  const org_roles: Record<string, Role> = {};
  for (const m of profile?.memberships ?? []) {
    // Ak by malo viacero členstiev v rovnakej org, ponechaj „silnejšiu" rolu.
    org_roles[m.organizationId] = m.role as Role;
  }

  const claims: AppClaims = {
    is_superadmin: profile?.isSuperAdmin ?? false,
    org_roles,
  };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: claims,
  });
  if (error) {
    throw new Error(`Nepodarilo sa zapísať app_metadata: ${error.message}`);
  }

  return claims;
}
