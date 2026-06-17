"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/auth/dal";
import { getActiveContext } from "@/lib/auth/active-context";
import { authorizeOrg } from "@/lib/auth/tenancy";
import { slugify, uniqueSlug } from "@/lib/catalog/slug";
import {
  flattenZodError,
  rawValues,
  strOrUndefined,
  type FormState,
} from "@/lib/forms";
import { StoreSchema } from "@/lib/stores/schemas";

const PATH = "/admin/predajne";

export async function saveStore(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = strOrUndefined(formData.get("id"));

  // Cieľová organizácia: pri úprave z predajne, inak aktívna organizácia.
  let organizationId: string | null;
  if (id) {
    const existing = await prisma.store.findUnique({
      where: { id },
      select: { organizationId: true },
    });
    organizationId = existing?.organizationId ?? null;
  } else {
    organizationId = (await getActiveContext()).organizationId;
  }
  if (!organizationId) {
    return { ok: false, message: "Nemáš aktívnu organizáciu." };
  }
  await authorizeOrg(organizationId, Role.ADMIN);

  const parsed = StoreSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    street: formData.get("street"),
    city: formData.get("city"),
    postalCode: formData.get("postalCode"),
    country: formData.get("country"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    currency: formData.get("currency"),
    isActive: formData.get("isActive"),
  });
  if (!parsed.success) {
    return { ok: false, errors: flattenZodError(parsed.error), values: rawValues(formData) };
  }

  const d = parsed.data;
  const slug = await uniqueSlug(d.slug ?? slugify(d.name), async (c) => {
    const found = await prisma.store.findFirst({
      where: { organizationId, slug: c },
      select: { id: true },
    });
    return !!found && found.id !== id;
  });

  try {
    const data = {
      name: d.name,
      slug,
      street: d.street ?? null,
      city: d.city ?? null,
      postalCode: d.postalCode ?? null,
      country: d.country ?? "SK",
      phone: d.phone ?? null,
      email: d.email ?? null,
      currency: d.currency,
      isActive: d.isActive,
    };
    if (id) {
      await prisma.store.update({ where: { id }, data });
    } else {
      await prisma.store.create({ data: { ...data, organizationId } });
    }
  } catch {
    return {
      ok: false,
      message: "Predajňu sa nepodarilo uložiť. Skús to znova.",
      values: rawValues(formData),
    };
  }

  revalidatePath(PATH);
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function deleteStore(id: string): Promise<FormState> {
  const store = await prisma.store.findUnique({
    where: { id },
    select: {
      organizationId: true,
      _count: { select: { orders: true } },
    },
  });
  if (!store) return { ok: false, message: "Predajňa neexistuje." };
  await authorizeOrg(store.organizationId, Role.ADMIN);

  if (store._count.orders > 0) {
    return {
      ok: false,
      message: "Predajňu nemožno zmazať — má evidované objednávky.",
    };
  }

  try {
    await prisma.store.delete({ where: { id } });
  } catch {
    return { ok: false, message: "Predajňu sa nepodarilo zmazať." };
  }

  revalidatePath(PATH);
  revalidatePath("/admin", "layout");
  return { ok: true };
}
