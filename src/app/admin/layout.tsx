import { cookies } from "next/headers";

import { requireProfile, getAccess } from "@/lib/auth/dal";
import { getActiveContext, getOrganizationOptions } from "@/lib/auth/active-context";
import { getActiveStore } from "@/lib/auth/tenancy";
import { ROLE_LABEL, Role, hasAtLeast } from "@/lib/rbac";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "@/components/admin/app-sidebar";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const profile = await requireProfile();
  const [organizations, active, access, activeStore, jar] = await Promise.all([
    getOrganizationOptions(),
    getActiveContext(),
    getAccess(),
    getActiveStore(),
    cookies(),
  ]);

  const roleLabel = profile.isSuperAdmin
    ? ROLE_LABEL[Role.SUPERADMIN]
    : active.membership
      ? ROLE_LABEL[active.membership.role as Role]
      : "Bez priradenej roly";

  const user = {
    name: profile.fullName ?? profile.email,
    email: profile.email,
    roleLabel,
  };

  const orgAdmin =
    !!active.organizationId &&
    (access.isSuperAdmin ||
      access.memberships.some(
        (m) =>
          m.organizationId === active.organizationId &&
          hasAtLeast(m.role as Role, Role.ADMIN),
      ));

  const caps = {
    store: activeStore.stores.length > 0,
    orgAdmin,
    superAdmin: profile.isSuperAdmin,
  };

  const defaultOpen = jar.get("sidebar_state")?.value !== "false";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar
        user={user}
        organizations={organizations.map((o) => ({ id: o.id, name: o.name }))}
        activeOrgId={active.organizationId}
        stores={activeStore.stores.map((s) => ({ id: s.id, name: s.name }))}
        activeStoreId={activeStore.store?.id ?? null}
        caps={caps}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <span className="text-sm font-medium">Administrácia</span>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
