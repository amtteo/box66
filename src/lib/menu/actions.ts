"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/auth/dal";
import { authorizeStore } from "@/lib/auth/tenancy";
import {
  flattenZodError,
  isUniqueViolation,
  rawValues,
  type FormState,
} from "@/lib/forms";
import { AddMenuItemSchema, UpdateMenuItemSchema } from "@/lib/menu/schemas";

const PATH = "/admin/menu";

/** Zapne globálny produkt do menu predajne s cenou a dostupnosťou. */
export async function addMenuItem(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = AddMenuItemSchema.safeParse({
    storeId: formData.get("storeId"),
    productId: formData.get("productId"),
    price: formData.get("price"),
    isAvailable: formData.get("isAvailable"),
    sortOrder: formData.get("sortOrder"),
  });
  if (!parsed.success) {
    return { ok: false, errors: flattenZodError(parsed.error), values: rawValues(formData) };
  }

  const { storeId, productId, price, isAvailable, sortOrder } = parsed.data;
  await authorizeStore(storeId, Role.MANAGER);

  // Produkt musí byť aktívny globálny produkt.
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { isActive: true },
  });
  if (!product || !product.isActive) {
    return { ok: false, errors: { productId: ["Neplatný alebo neaktívny produkt."] } };
  }

  try {
    await prisma.menuItem.create({
      data: { storeId, productId, price, isAvailable, sortOrder },
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

export async function updateMenuItem(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = UpdateMenuItemSchema.safeParse({
    menuItemId: formData.get("menuItemId"),
    price: formData.get("price"),
    isAvailable: formData.get("isAvailable"),
    sortOrder: formData.get("sortOrder"),
  });
  if (!parsed.success) {
    return { ok: false, errors: flattenZodError(parsed.error), values: rawValues(formData) };
  }

  const { menuItemId, price, isAvailable, sortOrder } = parsed.data;

  const item = await prisma.menuItem.findUnique({
    where: { id: menuItemId },
    select: { storeId: true },
  });
  if (!item) return { ok: false, message: "Položka menu neexistuje." };
  await authorizeStore(item.storeId, Role.MANAGER);

  try {
    await prisma.menuItem.update({
      where: { id: menuItemId },
      data: { price, isAvailable, sortOrder },
    });
  } catch {
    return { ok: false, message: "Položku menu sa nepodarilo uložiť." };
  }

  revalidatePath(PATH);
  return { ok: true };
}

export async function removeMenuItem(menuItemId: string): Promise<FormState> {
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
