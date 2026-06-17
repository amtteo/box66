import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { Role, hasAtLeast } from "@/lib/rbac";
import { getAccess } from "@/lib/auth/dal";
import { getActiveContext, ACTIVE_STORE_COOKIE } from "@/lib/auth/active-context";

const ADMIN_HOME = "/admin";

export type AccessibleStore = {
  id: string;
  name: string;
  slug: string;
  currency: string;
  isActive: boolean;
  organizationId: string;
};

/**
 * Predajne, ku ktorým má používateľ prístup v danej organizácii.
 * Superadmin a ADMIN organizácie vidia všetky predajne org; MANAGER/STAFF len
 * tie, ku ktorým majú členstvo.
 */
export const getAccessibleStores = cache(
  async (organizationId: string): Promise<AccessibleStore[]> => {
    const { isSuperAdmin, memberships } = await getAccess();

    const isOrgAdmin =
      isSuperAdmin ||
      memberships.some(
        (m) =>
          m.organizationId === organizationId &&
          hasAtLeast(m.role as Role, Role.ADMIN),
      );

    if (isOrgAdmin) {
      return prisma.store.findMany({
        where: { organizationId },
        orderBy: [{ isActive: "desc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          slug: true,
          currency: true,
          isActive: true,
          organizationId: true,
        },
      });
    }

    const storeIds = memberships
      .filter((m) => m.organizationId === organizationId && m.storeId)
      .map((m) => m.storeId as string);

    if (storeIds.length === 0) return [];

    return prisma.store.findMany({
      where: { id: { in: storeIds } },
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        currency: true,
        isActive: true,
        organizationId: true,
      },
    });
  },
);

export type ActiveStore = {
  store: AccessibleStore | null;
  stores: AccessibleStore[];
};

/**
 * Vyrieši aktívnu predajňu z cookie (validovanú voči prístupným predajniam
 * aktívnej organizácie). Ak cookie chýba/je neplatné, použije prvú dostupnú.
 */
export const getActiveStore = cache(async (): Promise<ActiveStore> => {
  const ctx = await getActiveContext();
  if (!ctx.organizationId) return { store: null, stores: [] };

  const stores = await getAccessibleStores(ctx.organizationId);
  if (stores.length === 0) return { store: null, stores };

  const jar = await cookies();
  const wanted = jar.get(ACTIVE_STORE_COOKIE)?.value;
  const store = stores.find((s) => s.id === wanted) ?? stores[0];
  return { store, stores };
});

/**
 * Vyžaduje aktívnu predajňu s aspoň `required` rolou pre stránky.
 * Bez prístupnej predajne presmeruje na admin dashboard.
 */
export async function requireActiveStore(
  required: Role = Role.STAFF,
): Promise<{ store: AccessibleStore; stores: AccessibleStore[] }> {
  const { store, stores } = await getActiveStore();
  if (!store) redirect(ADMIN_HOME);
  const ok = await hasStoreRole(store.id, required, store.organizationId);
  if (!ok) redirect(ADMIN_HOME);
  return { store, stores };
}

/**
 * Vyžaduje aktívnu organizáciu s aspoň `required` rolou pre stránky.
 * Bez prístupu presmeruje na admin dashboard.
 */
export async function requireActiveOrg(
  required: Role = Role.ADMIN,
): Promise<{ organizationId: string }> {
  const ctx = await getActiveContext();
  if (!ctx.organizationId) redirect(ADMIN_HOME);
  const ok = await hasOrgRole(ctx.organizationId, required);
  if (!ok) redirect(ADMIN_HOME);
  return { organizationId: ctx.organizationId };
}

/** Má používateľ aspoň `required` rolu v organizácii? */
export async function hasOrgRole(
  organizationId: string,
  required: Role,
): Promise<boolean> {
  const { isSuperAdmin, memberships } = await getAccess();
  if (isSuperAdmin) return true;
  return memberships.some(
    (m) =>
      m.organizationId === organizationId &&
      hasAtLeast(m.role as Role, required),
  );
}

/**
 * Má používateľ aspoň `required` rolu pre predajňu? ADMIN organizácie (členstvo
 * bez konkrétnej predajne) má prístup ku všetkým predajniam svojej org;
 * MANAGER/STAFF len ku svojej predajni.
 */
export async function hasStoreRole(
  storeId: string,
  required: Role,
  organizationId?: string,
): Promise<boolean> {
  const { isSuperAdmin, memberships } = await getAccess();
  if (isSuperAdmin) return true;

  const orgId =
    organizationId ??
    (
      await prisma.store.findUnique({
        where: { id: storeId },
        select: { organizationId: true },
      })
    )?.organizationId;
  if (!orgId) return false;

  return memberships.some((m) => {
    if (m.organizationId !== orgId) return false;
    if (!hasAtLeast(m.role as Role, required)) return false;
    // Členstvo viazané na konkrétnu predajňu musí sedieť; org-úroveň (null) platí pre celú org.
    if (m.storeId && m.storeId !== storeId) return false;
    return true;
  });
}

/**
 * Autorizačný guard pre Server Actions nad predajňou. Overí prístup a vráti
 * predajňu (id, org, mena). Vyhodí chybu, ak prístup nie je.
 */
export async function authorizeStore(
  storeId: string,
  required: Role,
): Promise<{ id: string; organizationId: string; currency: string }> {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { id: true, organizationId: true, currency: true },
  });
  if (!store) throw new Error("Predajňa neexistuje.");
  const ok = await hasStoreRole(store.id, required, store.organizationId);
  if (!ok) throw new Error("Nemáš oprávnenie pre túto predajňu.");
  return store;
}

/** Autorizačný guard pre Server Actions nad organizáciou. */
export async function authorizeOrg(
  organizationId: string,
  required: Role,
): Promise<void> {
  const ok = await hasOrgRole(organizationId, required);
  if (!ok) throw new Error("Nemáš oprávnenie pre túto organizáciu.");
}
