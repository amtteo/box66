import "server-only";

import { prisma } from "@/lib/prisma";

/** Všetky koeficienty cien (zoradené pre výber v admine). */
export async function getPriceCoefficients() {
  return prisma.priceCoefficient.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { stores: true } } },
  });
}

/** Predvolený koeficient Standard (1.0) pre nové predajne. */
export async function getDefaultPriceCoefficientId(): Promise<string> {
  const row = await prisma.priceCoefficient.findFirst({
    orderBy: { sortOrder: "asc" },
    select: { id: true },
  });
  if (!row) {
    throw new Error("Chýba koeficient Standard v databáze.");
  }
  return row.id;
}

export type PriceCoefficientRow = Awaited<ReturnType<typeof getPriceCoefficients>>[number];
