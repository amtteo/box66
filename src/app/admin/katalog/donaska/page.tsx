import type { Metadata } from "next";

import { requireProfile } from "@/lib/auth/dal";
import { redirect } from "next/navigation";
import { getDeliveryZoneDefaults } from "@/lib/delivery/queries";
import { DeliveryZonesForm } from "@/components/admin/delivery/delivery-zones-form";

export const metadata: Metadata = {
  title: "Predvolené zóny donášky — Katalóg",
};

export default async function DonaskaDefaultsPage() {
  const profile = await requireProfile();
  if (!profile.isSuperAdmin) redirect("/admin");

  const zones = await getDeliveryZoneDefaults();

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Predvolené zóny donášky
        </h1>
        <p className="text-sm text-muted-foreground">
          Šablóna pre nové predajne. Pri vytvorení predajne sa tieto zóny
          automaticky skopírujú.
        </p>
      </div>
      <DeliveryZonesForm
        mode="defaults"
        initialZones={zones}
      />
    </>
  );
}
