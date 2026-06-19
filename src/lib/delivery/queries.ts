import "server-only";

import { prisma } from "@/lib/prisma";
import { sortDeliveryZones } from "@/lib/delivery/zones";

export type PublicStoreOption = {
  id: string;
  name: string;
  slug: string;
  currency: string;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
};

/** Aktívne predajne pre verejný výber na úvodnej stránke. */
export async function getPublicStores(): Promise<PublicStoreOption[]> {
  return prisma.store.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      currency: true,
      city: true,
      latitude: true,
      longitude: true,
    },
  }).then((rows) =>
    rows.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      currency: s.currency,
      city: s.city,
      latitude: s.latitude != null ? Number(s.latitude) : null,
      longitude: s.longitude != null ? Number(s.longitude) : null,
    })),
  );
}

export async function getStoreDeliveryZones(storeId: string) {
  const zones = await prisma.storeDeliveryZone.findMany({
    where: { storeId },
    orderBy: [{ sortOrder: "asc" }, { minKm: "asc" }],
    select: {
      id: true,
      minKm: true,
      maxKm: true,
      price: true,
      sortOrder: true,
    },
  });
  return sortDeliveryZones(
    zones.map((z) => ({
      id: z.id,
      minKm: Number(z.minKm),
      maxKm: Number(z.maxKm),
      price: Number(z.price),
      sortOrder: z.sortOrder,
    })),
  );
}

export async function getDeliveryZoneDefaults() {
  if (!prisma.deliveryZoneDefault) {
    throw new Error(
      "Prisma klient nie je aktuálny. Spusti `npm run db:generate` a reštartuj dev server (`npm run dev`).",
    );
  }

  const zones = await prisma.deliveryZoneDefault.findMany({
    orderBy: [{ sortOrder: "asc" }, { minKm: "asc" }],
    select: {
      id: true,
      minKm: true,
      maxKm: true,
      price: true,
      sortOrder: true,
    },
  });
  return sortDeliveryZones(
    zones.map((z) => ({
      id: z.id,
      minKm: Number(z.minKm),
      maxKm: Number(z.maxKm),
      price: Number(z.price),
      sortOrder: z.sortOrder,
    })),
  );
}

export type DeliveryZoneListItem = Awaited<
  ReturnType<typeof getStoreDeliveryZones>
>[number];
