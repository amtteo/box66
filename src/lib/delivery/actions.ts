"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getProfile, requireProfile } from "@/lib/auth/dal";
import { Role } from "@/lib/rbac";
import { authorizeStore } from "@/lib/auth/tenancy";
import { computeDeliveryForStore } from "@/lib/delivery/compute";
import { geocodeDeliveryAddress } from "@/lib/delivery/geocode";
import { getCustomerCompletedDeliveryAddresses } from "@/lib/delivery/queries";
import {
  CalculateDeliverySchema,
  DeliveryZonesFormSchema,
} from "@/lib/delivery/schemas";
import type { FormState } from "@/lib/forms";

export type CalculateDeliveryResult =
  | {
      ok: true;
      distanceKm: number;
      durationMinutes: number;
      fee: number;
      currency: string;
    }
  | { ok: false; message: string };

/** Vypočíta cenu donášky pre zvolenú predajňu a adresu (server-side, Distance Matrix). */
export async function calculateDeliveryFee(
  input: unknown,
): Promise<CalculateDeliveryResult> {
  const parsed = CalculateDeliverySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message:
        parsed.error.issues[0]?.message ?? "Skontroluj adresu doručenia.",
    };
  }

  const { storeId, deliveryAddress } = parsed.data;
  return computeDeliveryForStore(storeId, deliveryAddress);
}

export type DeliveryAddressHistoryResult =
  | { ok: true; orderAddresses: string[] }
  | { ok: false; message: string };

/** Adresy z dokončených donášok prihláseného zákazníka (max 3). */
export async function fetchDeliveryAddressHistory(): Promise<DeliveryAddressHistoryResult> {
  const profile = await getProfile();
  if (!profile) {
    return { ok: false, message: "Nie si prihlásený." };
  }

  const orderAddresses = await getCustomerCompletedDeliveryAddresses(
    profile.id,
    3,
  );
  return { ok: true, orderAddresses };
}

/** Geokóduje adresu pre výber predajne (haversine). */
export async function resolveDeliveryAddressCoords(address: string) {
  return geocodeDeliveryAddress(address);
}

const STORE_DELIVERY_PATH = "/admin/donaska";
const DEFAULT_DELIVERY_PATH = "/admin/katalog/donaska";

/** Uloží doručovacie zóny aktívnej predajne. */
export async function saveStoreDeliveryZones(
  storeId: string,
  zones: unknown,
): Promise<FormState> {
  await authorizeStore(storeId, Role.MANAGER);

  const parsed = DeliveryZonesFormSchema.safeParse({ zones });
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Neplatné zóny.",
    };
  }

  const rows = parsed.data.zones;

  await prisma.$transaction(async (tx) => {
    await tx.storeDeliveryZone.deleteMany({ where: { storeId } });
    if (rows.length > 0) {
      await tx.storeDeliveryZone.createMany({
        data: rows.map((z, i) => ({
          storeId,
          minKm: z.minKm,
          maxKm: z.maxKm,
          price: z.price,
          sortOrder: z.sortOrder ?? i,
        })),
      });
    }
  });

  revalidatePath(STORE_DELIVERY_PATH);
  return { ok: true };
}

/** Uloží predvolené doručovacie zóny platformy (centrála). */
export async function saveDeliveryZoneDefaults(
  zones: unknown,
): Promise<FormState> {
  const profile = await requireProfile();
  if (!profile.isSuperAdmin) {
    return { ok: false, message: "Nemáš oprávnenie meniť predvolené zóny." };
  }

  const parsed = DeliveryZonesFormSchema.safeParse({ zones });
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Neplatné zóny.",
    };
  }

  const rows = parsed.data.zones;

  await prisma.$transaction(async (tx) => {
    await tx.deliveryZoneDefault.deleteMany();
    if (rows.length > 0) {
      await tx.deliveryZoneDefault.createMany({
        data: rows.map((z, i) => ({
          minKm: z.minKm,
          maxKm: z.maxKm,
          price: z.price,
          sortOrder: z.sortOrder ?? i,
        })),
      });
    }
  });

  revalidatePath(DEFAULT_DELIVERY_PATH);
  return { ok: true };
}

/** Skopíruje predvolené zóny platformy do novej predajne. */
export async function seedStoreDeliveryZones(storeId: string) {
  const defaults = await prisma.deliveryZoneDefault.findMany({
    orderBy: [{ sortOrder: "asc" }, { minKm: "asc" }],
  });

  const rows =
    defaults.length > 0
      ? defaults
      : [{ minKm: 0, maxKm: 6, price: 1.99, sortOrder: 0 }];

  await prisma.storeDeliveryZone.createMany({
    data: rows.map((z, i) => ({
      storeId,
      minKm: z.minKm,
      maxKm: z.maxKm,
      price: z.price,
      sortOrder: z.sortOrder ?? i,
    })),
  });
}
