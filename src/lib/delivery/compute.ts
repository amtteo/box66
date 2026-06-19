import "server-only";

import { prisma } from "@/lib/prisma";
import { formatStoreAddress } from "@/lib/delivery/address";
import { getDrivingRoute } from "@/lib/delivery/google";
import { getStoreDeliveryZones } from "@/lib/delivery/queries";
import { resolveDeliveryFee } from "@/lib/delivery/zones";

export type DeliveryComputation =
  | {
      ok: true;
      distanceKm: number;
      durationMinutes: number;
      fee: number;
      currency: string;
    }
  | { ok: false; message: string };

/** Vypočíta donášku pre predajňu a adresu (zdieľané server action + checkout). */
export async function computeDeliveryForStore(
  storeId: string,
  deliveryAddress: string,
): Promise<DeliveryComputation> {
  const store = await prisma.store.findFirst({
    where: { id: storeId, isActive: true },
    select: {
      id: true,
      currency: true,
      street: true,
      city: true,
      postalCode: true,
      country: true,
    },
  });
  if (!store) {
    return { ok: false, message: "Predajňa nie je dostupná." };
  }

  const origin = formatStoreAddress(store);
  if (!origin) {
    return {
      ok: false,
      message: "Predajňa nemá zadanú adresu pre výpočet donášky.",
    };
  }

  let distanceKm: number;
  let durationMinutes: number;
  try {
    const route = await getDrivingRoute(origin, deliveryAddress);
    distanceKm = route.distanceKm;
    durationMinutes = route.durationMinutes;
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Výpočet vzdialenosti zlyhal.";
    return { ok: false, message: msg };
  }

  const zones = await getStoreDeliveryZones(storeId);
  if (zones.length === 0) {
    return { ok: false, message: "Predajňa nemá nastavené doručovacie zóny." };
  }

  const fee = resolveDeliveryFee(distanceKm, zones);
  if (fee == null) {
    return {
      ok: false,
      message: `Do vzdialenosti ${distanceKm} km z tejto predajne nedoručujeme.`,
    };
  }

  return { ok: true, distanceKm, durationMinutes, fee, currency: store.currency };
}
