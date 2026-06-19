import "server-only";

import { prisma } from "@/lib/prisma";

export type LegalOperator = {
  tradeName: string;
  legalName: string;
  street: string | null;
  city: string | null;
  postalCode: string | null;
  country: string;
  ico: string | null;
  dic: string | null;
  icDph: string | null;
  email: string | null;
  phone: string | null;
  storeName: string | null;
};

/** Identifikačné údaje obchodníka pre právne dokumenty (prvá aktívna predajňa + organizácia). */
export async function getLegalOperator(): Promise<LegalOperator> {
  const store = await prisma.store.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    select: {
      name: true,
      street: true,
      city: true,
      postalCode: true,
      country: true,
      phone: true,
      email: true,
      organization: {
        select: {
          name: true,
          legalName: true,
          ico: true,
          dic: true,
          icDph: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          postalCode: true,
          country: true,
        },
      },
    },
  });

  const org = store?.organization;

  return {
    tradeName: "Box66",
    legalName: org?.legalName ?? org?.name ?? "Box66",
    street: store?.street ?? org?.address ?? null,
    city: store?.city ?? org?.city ?? null,
    postalCode: store?.postalCode ?? org?.postalCode ?? null,
    country: store?.country ?? org?.country ?? "SK",
    ico: org?.ico ?? null,
    dic: org?.dic ?? null,
    icDph: org?.icDph ?? null,
    email: store?.email ?? org?.email ?? null,
    phone: store?.phone ?? org?.phone ?? null,
    storeName: store?.name ?? null,
  };
}

export function formatLegalAddress(op: LegalOperator): string | null {
  const line = [
    op.street,
    [op.postalCode, op.city].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");
  return line || null;
}
