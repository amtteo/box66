import type { Metadata } from "next";

import { requireRole, Role } from "@/lib/auth/dal";
import { getPriceCoefficients } from "@/lib/pricing/queries";
import { CoefficientDialog } from "@/components/admin/pricing/coefficient-dialog";
import {
  CoefficientsTable,
  type CoefficientListItem,
} from "@/components/admin/pricing/coefficients-table";

export const metadata: Metadata = { title: "Koeficienty cien" };

export default async function KoeficientyCienPage() {
  await requireRole(Role.SUPERADMIN);
  const coefficients = await getPriceCoefficients();

  const items: CoefficientListItem[] = coefficients.map((c) => ({
    id: c.id,
    name: c.name,
    multiplier: c.multiplier.toString(),
    sortOrder: c.sortOrder,
    storeCount: c._count.stores,
  }));

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Koeficienty cien</h1>
          <p className="text-sm text-muted-foreground">
            Násobiteľ základnej ceny z katalógu. Predajniam priraďuješ koeficient v sekcii
            Predajne.
          </p>
        </div>
        <CoefficientDialog />
      </div>
      <CoefficientsTable coefficients={items} />
    </>
  );
}
