import "server-only";

import { prisma } from "@/lib/prisma";

/** Všetci dodávatelia (centrála) + počet priradených predajní a cenníkových položiek. */
export async function getSuppliers() {
  return prisma.supplier.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    include: {
      _count: { select: { storeLinks: true, prices: true } },
    },
  });
}

/** Schválení dodávatelia danej predajne (pre sklad / príjem). */
export async function getStoreSupplierOptions(storeId: string) {
  const links = await prisma.storeSupplier.findMany({
    where: { storeId, isActive: true, supplier: { isActive: true } },
    orderBy: [{ supplier: { name: "asc" } }],
    select: { supplier: { select: { id: true, name: true } } },
  });
  return links.map((l) => l.supplier);
}

/** Jeden dodávateľ (detail). */
export async function getSupplierById(id: string) {
  return prisma.supplier.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      contactName: true,
      email: true,
      phone: true,
      address: true,
      ico: true,
      dic: true,
      notes: true,
      isActive: true,
      storeLinks: {
        select: { storeId: true, isActive: true },
      },
    },
  });
}

/** Všetky predajne pre priradenie dodávateľa (centrála). */
export async function getAllStoresForAssignment() {
  return prisma.store.findMany({
    orderBy: [{ organization: { name: "asc" } }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      city: true,
      organization: { select: { name: true } },
    },
  });
}

/** Cenník pre kombináciu predajňa + dodávateľ. */
export async function getSupplierPrices(supplierId: string, storeId: string) {
  return prisma.supplierIngredient.findMany({
    where: { supplierId, storeId },
    orderBy: [{ ingredient: { name: "asc" } }],
    include: {
      ingredient: { select: { id: true, name: true, unit: true } },
    },
  });
}

/** Predajne priradené dodávateľovi. */
export async function getSupplierStoreIds(supplierId: string) {
  const links = await prisma.storeSupplier.findMany({
    where: { supplierId, isActive: true },
    select: { storeId: true },
  });
  return links.map((l) => l.storeId);
}

export type SupplierRow = Awaited<ReturnType<typeof getSuppliers>>[number];
export type SupplierPriceRow = Awaited<ReturnType<typeof getSupplierPrices>>[number];
