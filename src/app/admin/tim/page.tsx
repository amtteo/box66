import type { Metadata } from "next";

import { requireActiveOrg } from "@/lib/auth/tenancy";
import { getOrgMembers } from "@/lib/team/queries";
import { getStoresForOrg } from "@/lib/stores/queries";
import { ROLE_RANK, Role } from "@/lib/rbac";
import { MemberDialog } from "@/components/admin/team/member-dialog";
import { MembersTable, type MemberListItem } from "@/components/admin/team/members-table";

export const metadata: Metadata = { title: "Tím a role" };

export default async function TimPage() {
  const { organizationId } = await requireActiveOrg();
  const [members, stores] = await Promise.all([
    getOrgMembers(organizationId),
    getStoresForOrg(organizationId),
  ]);

  const storeOptions = stores.map((s) => ({ id: s.id, name: s.name }));

  const items: MemberListItem[] = members.map((m) => ({
    membershipId: m.id,
    email: m.profile.email,
    name: m.profile.fullName,
    role: m.role,
    storeId: m.storeId ?? "",
    storeName: m.store?.name ?? null,
    status: m.status,
    manageable: ROLE_RANK[m.role as Role] < ROLE_RANK[Role.ADMIN],
  }));

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tím a role</h1>
          <p className="text-sm text-muted-foreground">
            Priraď prevádzkarov (MANAGER) a obsluhu (STAFF) k predajniam.
            Administrátorov organizácie spravuje superadmin.
          </p>
        </div>
        <MemberDialog stores={storeOptions} />
      </div>
      <MembersTable members={items} stores={storeOptions} />
    </>
  );
}
