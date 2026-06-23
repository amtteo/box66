"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { Role, requireRole } from "@/lib/auth/dal";
import { authorizeStore } from "@/lib/auth/tenancy";
import {
  flattenZodError,
  isUniqueViolation,
  rawValues,
  type FormState,
} from "@/lib/forms";
import {
  AddMenuItemSchema,
  ToggleMenuItemAvailabilitySchema,
} from "@/lib/menu/schemas";

const PATH = "/admin/menu";

/** Priradí globálny produkt do menu predajne (iba superadmin). Cena sa berie z katalógu. */
export async function addMenuItem(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole(Role.SUPERADMIN);

  const parsed = AddMenuItemSchema.safeParse({
    storeId: formData.get("storeId"),
    productId: formData.get("productId"),
    isAvailable: formData.get("isAvailable"),
  });
  if (!parsed.success) {
    return { ok: false, errors: flattenZodError(parsed.error), values: rawValues(formData) };
  }

  const { storeId, productId, isAvailable } = parsed.data;
  await authorizeStore(storeId, Role.MANAGER);

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { isActive: true, sortOrder: true },
  });
  if (!product || !product.isActive) {
    return { ok: false, errors: { productId: ["Neplatný alebo neaktívny produkt."] } };
  }

  try {
    await prisma.menuItem.create({
      data: {
        storeId,
        productId,
        isAvailable,
        sortOrder: product.sortOrder,
      },
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      return { ok: false, message: "Tento produkt už v menu predajne je." };
    }
    return { ok: false, message: "Položku menu sa nepodarilo pridať." };
  }

  revalidatePath(PATH);
  return { ok: true };
}

/** Prepne dostupnosť položky v menu predajne (manažér predajne). */
export async function toggleMenuItemAvailability(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = ToggleMenuItemAvailabilitySchema.safeParse({
    menuItemId: formData.get("menuItemId"),
    isAvailable: formData.get("isAvailable"),
  });
  if (!parsed.success) {
    return { ok: false, errors: flattenZodError(parsed.error) };
  }

  const { menuItemId, isAvailable } = parsed.data;

  const item = await prisma.menuItem.findUnique({
    where: { id: menuItemId },
    select: { storeId: true },
  });
  if (!item) return { ok: false, message: "Položka menu neexistuje." };
  await authorizeStore(item.storeId, Role.MANAGER);

  try {
    await prisma.menuItem.update({
      where: { id: menuItemId },
      data: { isAvailable },
    });
  } catch {
    return { ok: false, message: "Dostupnosť sa nepodarilo uložiť." };
  }

  revalidatePath(PATH);
  return { ok: true };
}

/** Odstráni produkt z menu predajne (iba superadmin). */
export async function removeMenuItem(menuItemId: string): Promise<FormState> {
  await requireRole(Role.SUPERADMIN);

  const item = await prisma.menuItem.findUnique({
    where: { id: menuItemId },
    select: { storeId: true },
  });
  if (!item) return { ok: false, message: "Položka menu neexistuje." };
  await authorizeStore(item.storeId, Role.MANAGER);

  try {
    await prisma.menuItem.delete({ where: { id: menuItemId } });
  } catch {
    return { ok: false, message: "Položku menu sa nepodarilo odstrániť." };
  }

  revalidatePath(PATH);
  return { ok: true };
}
