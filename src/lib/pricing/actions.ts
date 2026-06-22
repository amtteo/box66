"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { Role, requireRole } from "@/lib/auth/dal";
import { authorizeStore } from "@/lib/auth/tenancy";
import {
  flattenZodError,
  rawValues,
  strOrUndefined,
  type FormState,
} from "@/lib/forms";
import {
  MenuCustomPriceSchema,
  PriceCoefficientSchema,
} from "@/lib/pricing/schemas";

const COEFFICIENTS_PATH = "/admin/koeficienty-cien";
const MENU_PATH = "/admin/menu";
const STORES_PATH = "/admin/predajne";

export async function savePriceCoefficient(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole(Role.SUPERADMIN);

  const id = strOrUndefined(formData.get("id"));
  const parsed = PriceCoefficientSchema.safeParse({
    name: formData.get("name"),
    multiplier: formData.get("multiplier"),
    sortOrder: formData.get("sortOrder"),
  });
  if (!parsed.success) {
    return { ok: false, errors: flattenZodError(parsed.error), values: rawValues(formData) };
  }

  const d = parsed.data;
  try {
    if (id) {
      await prisma.priceCoefficient.update({
        where: { id },
        data: { name: d.name, multiplier: d.multiplier, sortOrder: d.sortOrder },
      });
    } else {
      await prisma.priceCoefficient.create({ data: d });
    }
  } catch {
    return {
      ok: false,
      message: "Koeficient sa nepodarilo uložiť.",
      values: rawValues(formData),
    };
  }

  revalidatePath(COEFFICIENTS_PATH);
  revalidatePath(STORES_PATH);
  revalidatePath(MENU_PATH);
  return { ok: true };
}

export async function deletePriceCoefficient(id: string): Promise<FormState> {
  await requireRole(Role.SUPERADMIN);

  const used = await prisma.store.count({ where: { priceCoefficientId: id } });
  if (used > 0) {
    return {
      ok: false,
      message: `Koeficient používa ${used} predajní. Najprv im priraď iný koeficient.`,
    };
  }

  try {
    await prisma.priceCoefficient.delete({ where: { id } });
  } catch {
    return { ok: false, message: "Koeficient sa nepodarilo zmazať." };
  }

  revalidatePath(COEFFICIENTS_PATH);
  return { ok: true };
}

/** Nastaví alebo zruší individuálnu cenu položky menu (iba superadmin). */
export async function setMenuItemCustomPrice(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole(Role.SUPERADMIN);

  const parsed = MenuCustomPriceSchema.safeParse({
    menuItemId: formData.get("menuItemId"),
    customPrice: formData.get("customPrice"),
  });
  if (!parsed.success) {
    return { ok: false, errors: flattenZodError(parsed.error) };
  }

  const { menuItemId, customPrice } = parsed.data;
  const item = await prisma.menuItem.findUnique({
    where: { id: menuItemId },
    select: { storeId: true },
  });
  if (!item) return { ok: false, message: "Položka menu neexistuje." };
  await authorizeStore(item.storeId, Role.MANAGER);

  try {
    await prisma.menuItem.update({
      where: { id: menuItemId },
      data: { customPrice: customPrice ?? null },
    });
  } catch {
    return { ok: false, message: "Cenu sa nepodarilo uložiť." };
  }

  revalidatePath(MENU_PATH);
  revalidatePath("/", "layout");
  revalidatePath("/menu", "layout");
  return { ok: true };
}
