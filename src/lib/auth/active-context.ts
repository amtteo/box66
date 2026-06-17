import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";

import { getProfile, type CurrentMembership } from "@/lib/auth/dal";

export const ACTIVE_ORG_COOKIE = "box66_active_org";
export const ACTIVE_STORE_COOKIE = "box66_active_store";

export type ActiveContext = {
  organizationId: string | null;
  storeId: string | null;
  organization: CurrentMembership["organization"] | null;
  store: NonNullable<CurrentMembership["store"]> | null;
  /** Členstvo, ktoré určuje rolu používateľa v aktívnom kontexte. */
  membership: CurrentMembership | null;
};

const EMPTY: ActiveContext = {
  organizationId: null,
  storeId: null,
  organization: null,
  store: null,
  membership: null,
};

/**
 * Vyrieši aktívnu organizáciu/predajňu z cookies, validovanú voči členstvám
 * používateľa. Ak cookie chýba alebo je neplatné, použije prvé členstvo ako
 * predvolené. Vracia prázdny kontext, ak používateľ nemá žiadne členstvá.
 */
export const getActiveContext = cache(async (): Promise<ActiveContext> => {
  const profile = await getProfile();
  if (!profile || profile.memberships.length === 0) return EMPTY;

  const jar = await cookies();
  const wantedOrg = jar.get(ACTIVE_ORG_COOKIE)?.value;
  const wantedStore = jar.get(ACTIVE_STORE_COOKIE)?.value;

  const memberships = profile.memberships;

  // Vyber členstvo podľa cookie (org + voliteľne store), inak prvé dostupné.
  const membership =
    memberships.find((m) => {
      if (wantedOrg && m.organizationId !== wantedOrg) return false;
      if (wantedStore) return m.storeId === wantedStore;
      return true;
    }) ??
    memberships.find((m) => m.organizationId === wantedOrg) ??
    memberships[0];

  return {
    organizationId: membership.organizationId,
    storeId: membership.storeId,
    organization: membership.organization,
    store: membership.store,
    membership,
  };
});

/** Zoznam organizácií, do ktorých používateľ patrí (na prepínač). */
export const getOrganizationOptions = cache(async () => {
  const profile = await getProfile();
  if (!profile) return [];

  const seen = new Map<string, CurrentMembership["organization"]>();
  for (const m of profile.memberships) {
    if (!seen.has(m.organizationId)) seen.set(m.organizationId, m.organization);
  }
  return [...seen.values()];
});
