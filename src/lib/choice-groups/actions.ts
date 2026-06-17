"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole, Role } from "@/lib/auth/dal";
import {
  flattenZodError,
  rawValues,
  strOrUndefined,
  type FormState,
} from "@/lib/forms";
import {
  ChoiceGroupSchema,
  UpdateChoiceGroupSchema,
} from "@/lib/choice-groups/schemas";

const PRODUCTS_PATH = "/admin/katalog/produkty";

function productPath(productId: string) {
  return `${PRODUCTS_PATH}/${productId}`;
}

/** Vytvorí alebo upraví skupinu výberu (kombo) na produkte. */
export async function saveChoiceGroup(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole(Role.SUPERADMIN);

  const id = strOrUndefined(formData.get("id"));

  if (id) {
    const parsed = UpdateChoiceGroupSchema.safeParse({
      id,
      label: formData.get("label"),
      minSelect: formData.get("minSelect"),
      maxSelect: formData.get("maxSelect"),
      sortOrder: formData.get("sortOrder"),
    });
    if (!parsed.success) {
      return { ok: false, errors: flattenZodError(parsed.error), values: rawValues(formData) };
    }
    if (parsed.data.maxSelect < parsed.data.minSelect) {
      return { ok: false, errors: { maxSelect: ["Maximum nemôže byť menšie ako minimum."] }, values: rawValues(formData) };
    }

    try {
      const updated = await prisma.productChoiceGroup.update({
        where: { id: parsed.data.id },
        data: {
          label: parsed.data.label,
          minSelect: parsed.data.minSelect,
          maxSelect: parsed.data.maxSelect,
          sortOrder: parsed.data.sortOrder,
        },
        select: { productId: true },
      });
      revalidatePath(productPath(updated.productId));
      return { ok: true };
    } catch {
      return { ok: false, message: "Výber sa nepodarilo uložiť.", values: rawValues(formData) };
    }
  }

  const parsed = ChoiceGroupSchema.safeParse({
    productId: formData.get("productId"),
    categoryId: formData.get("categoryId"),
    label: formData.get("label"),
    minSelect: formData.get("minSelect"),
    maxSelect: formData.get("maxSelect"),
    sortOrder: formData.get("sortOrder"),
  });
  if (!parsed.success) {
    return { ok: false, errors: flattenZodError(parsed.error), values: rawValues(formData) };
  }

  const [product, category] = await Promise.all([
    prisma.product.findUnique({
      where: { id: parsed.data.productId },
      select: { id: true },
    }),
    prisma.category.findUnique({
      where: { id: parsed.data.categoryId },
      select: { isChoicePool: true },
    }),
  ]);
  if (!product) {
    return { ok: false, errors: { productId: ["Produkt neexistuje."] } };
  }
  if (!category?.isChoicePool) {
    return {
      ok: false,
      errors: { categoryId: ["Kategória nie je označená ako pool výberu."] },
      values: rawValues(formData),
    };
  }

  try {
    await prisma.productChoiceGroup.create({
      data: {
        productId: parsed.data.productId,
        categoryId: parsed.data.categoryId,
        label: parsed.data.label,
        minSelect: parsed.data.minSelect,
        maxSelect: parsed.data.maxSelect,
        sortOrder: parsed.data.sortOrder,
      },
    });
  } catch {
    return { ok: false, message: "Výber sa nepodarilo vytvoriť.", values: rawValues(formData) };
  }

  revalidatePath(productPath(parsed.data.productId));
  return { ok: true };
}

/** Zmaže skupinu výberu z produktu. */
export async function deleteChoiceGroup(id: string): Promise<FormState> {
  await requireRole(Role.SUPERADMIN);

  try {
    const deleted = await prisma.productChoiceGroup.delete({
      where: { id },
      select: { productId: true },
    });
    revalidatePath(productPath(deleted.productId));
    return { ok: true };
  } catch {
    return { ok: false, message: "Výber sa nepodarilo zmazať." };
  }
}
