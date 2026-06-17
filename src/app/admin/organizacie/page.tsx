import type { Metadata } from "next";

import { requireRole, Role } from "@/lib/auth/dal";
import { getOrganizations } from "@/lib/orgs/queries";
import { OrgDialog } from "@/components/admin/orgs/org-dialog";
import { OrgsTable, type OrgListItem } from "@/components/admin/orgs/orgs-table";

export const metadata: Metadata = { title: "Organizácie" };

export default async function OrganizaciePage() {
  await requireRole(Role.SUPERADMIN);
  const organizations = await getOrganizations();

  const items: OrgListItem[] = organizations.map((o) => ({
    id: o.id,
    name: o.name,
    slug: o.slug,
    legalName: o.legalName ?? "",
    ico: o.ico ?? "",
    dic: o.dic ?? "",
    icDph: o.icDph ?? "",
    email: o.email ?? "",
    phone: o.phone ?? "",
    address: o.address ?? "",
    city: o.city ?? "",
    postalCode: o.postalCode ?? "",
    country: o.country ?? "SK",
    isActive: o.isActive,
    storeCount: o._count.stores,
    memberCount: o._count.memberships,
    admins: o.memberships.map((m) => ({
      membershipId: m.id,
      email: m.profile.email,
      name: m.profile.fullName,
    })),
  }));

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Organizácie</h1>
          <p className="text-sm text-muted-foreground">
            Franšízanti platformy. Vytvor organizáciu a priraď jej administrátora.
          </p>
        </div>
        <OrgDialog />
      </div>
      <OrgsTable organizations={items} />
    </>
  );
}
