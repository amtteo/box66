import type { Metadata } from "next";

import { requireActiveStore } from "@/lib/auth/tenancy";
import { Role } from "@/lib/rbac";
import { getStoreDeliveryZones } from "@/lib/delivery/queries";
import { DeliveryZonesForm } from "@/components/admin/delivery/delivery-zones-form";

export const metadata: Metadata = { title: "Donáška predajne" };

export default async function DonaskaPage() {
  const { store } = await requireActiveStore(Role.MANAGER);
  const zones = await getStoreDeliveryZones(store.id);

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Donáška</h1>
        <p className="text-sm text-muted-foreground">
          {store.name} — doručovacie zóny podľa vzdialenosti (km) od predajne.
          Cena sa počíta cez Google Routes API podľa adresy zákazníka.
        </p>
      </div>
      <DeliveryZonesForm
        storeId={store.id}
        initialZones={zones}
        description="Zóna platí pre vzdialenosť od min. km do max. km (vrátane). Uisti sa, že predajňa má v profile vyplnenú adresu."
      />
    </>
  );
}
