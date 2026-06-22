import "server-only";

import { prisma } from "@/lib/prisma";
import { OrderStatus, OrderType } from "@/generated/prisma/enums";
import { sortDeliveryZones } from "@/lib/delivery/zones";

export type PublicStoreOption = {
  id: string;
  name: string;
  slug: string;
  currency: string;
  street: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
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
      street: true,
      city: true,
      postalCode: true,
      country: true,
      latitude: true,
      longitude: true,
    },
  }).then((rows) =>
    rows.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      currency: s.currency,
      street: s.street,
      city: s.city,
      postalCode: s.postalCode,
      country: s.country,
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

export type CustomerDeliveryAddress = {
  address: string;
  lat: number | null;
  lng: number | null;
};

/** Posledné unikátne adresy doručenia z dokončených objednávok zákazníka. */
export async function getCustomerCompletedDeliveryAddresses(
  customerId: string,
  limit = 3,
): Promise<CustomerDeliveryAddress[]> {
  const orders = await prisma.order.findMany({
    where: {
      customerId,
      type: OrderType.DELIVERY,
      status: OrderStatus.COMPLETED,
      deliveryAddress: { not: null },
    },
    orderBy: { completedAt: "desc" },
    select: {
      deliveryAddress: true,
      deliveryLatitude: true,
      deliveryLongitude: true,
    },
    take: 20,
  });

  const seen = new Set<string>();
  const addresses: CustomerDeliveryAddress[] = [];

  for (const order of orders) {
    const addr = order.deliveryAddress?.trim();
    if (!addr) continue;
    const key = addr.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    addresses.push({
      address: addr,
      lat:
        order.deliveryLatitude != null
          ? Number(order.deliveryLatitude)
          : null,
      lng:
        order.deliveryLongitude != null
          ? Number(order.deliveryLongitude)
          : null,
    });
    if (addresses.length >= limit) break;
  }

  return addresses;
}
