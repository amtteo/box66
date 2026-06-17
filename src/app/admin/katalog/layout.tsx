import type { ReactNode } from "react";

import { requireRole, Role } from "@/lib/auth/dal";
import { CatalogNav } from "@/components/admin/catalog/catalog-nav";

export default async function KatalogLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  await requireRole(Role.SUPERADMIN);

  return (
    <div className="flex flex-col gap-6">
      <CatalogNav />
      {children}
    </div>
  );
}
