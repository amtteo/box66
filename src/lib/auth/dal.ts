import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { MembershipStatus } from "@/generated/prisma/enums";
import { Role, hasAtLeast } from "@/lib/rbac";

export const LOGIN_PATH = "/prihlasenie";
const ADMIN_HOME = "/admin";

/** Rozsah, v ktorom sa overuje rola (organizácia alebo konkrétna predajňa). */
export type RoleScope = {
  organizationId?: string;
  storeId?: string;
};

/**
 * Aktuálne prihlásený používateľ z overenej Supabase session, alebo `null`.
 * Memoizované v rámci jedného renderu (React `cache`).
 *
 * Vždy používa `getUser()` (kontaktuje Auth server) — nie `getSession()`,
 * ktorý dôveruje cookie bez overenia.
 */
export const getUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** Profil (Prisma) prihláseného používateľa vrátane aktívnych členstiev. */
export const getProfile = cache(async () => {
  const user = await getUser();
  if (!user) return null;

  return prisma.profile.findUnique({
    where: { id: user.id },
    include: {
      memberships: {
        where: { status: MembershipStatus.ACTIVE },
        include: { organization: true, store: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
});

export type CurrentProfile = NonNullable<
  Awaited<ReturnType<typeof getProfile>>
>;
export type CurrentMembership = CurrentProfile["memberships"][number];

/** Vyžaduje prihláseného používateľa, inak presmeruje na prihlásenie. */
export const requireUser = cache(async (): Promise<User> => {
  const user = await getUser();
  if (!user) redirect(LOGIN_PATH);
  return user;
});

/**
 * Vyžaduje existujúci profil (a teda prihlásenie). Profil vzniká triggerom nad
 * `auth.users`; ak by chýbal, používateľa odhlásime na prihlasovaciu stránku.
 */
export const requireProfile = cache(async (): Promise<CurrentProfile> => {
  await requireUser();
  const profile = await getProfile();
  if (!profile) redirect(LOGIN_PATH);
  return profile;
});

/** Súhrn oprávnení používateľa pre rýchle (autoritatívne) kontroly. */
export const getAccess = cache(async () => {
  const profile = await getProfile();
  if (!profile) {
    return {
      isSuperAdmin: false,
      memberships: [] as CurrentMembership[],
      hasAnyMembership: false,
    };
  }
  return {
    isSuperAdmin: profile.isSuperAdmin,
    memberships: profile.memberships,
    hasAnyMembership: profile.memberships.length > 0,
  };
});

/**
 * Autoritatívna kontrola roly nad DB. Superadmin má prístup vždy.
 * Bez `scope` stačí mať `required` rolu v ľubovoľnej organizácii.
 */
export async function hasRole(
  required: Role,
  scope?: RoleScope,
): Promise<boolean> {
  const { isSuperAdmin, memberships } = await getAccess();
  if (isSuperAdmin) return true;

  return memberships.some((m) => {
    if (!hasAtLeast(m.role as Role, required)) return false;
    if (scope?.organizationId && m.organizationId !== scope.organizationId) {
      return false;
    }
    if (scope?.storeId && m.storeId && m.storeId !== scope.storeId) {
      return false;
    }
    return true;
  });
}

/**
 * Guard pre chránené sekcie — vyžaduje aspoň `required` rolu. Neprihláseného
 * presmeruje na prihlásenie, prihláseného bez oprávnenia na admin dashboard.
 */
export async function requireRole(
  required: Role,
  scope?: RoleScope,
): Promise<CurrentProfile> {
  const profile = await requireProfile();
  const allowed = await hasRole(required, scope);
  if (!allowed) redirect(ADMIN_HOME);
  return profile;
}

export { Role };
