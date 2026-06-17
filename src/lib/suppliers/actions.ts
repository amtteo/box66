"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole, Role } from "@/lib/auth/dal";
import {
  flattenZodError,
  isUniqueViolation,
  rawValues,
  strOrUndefined,
  type FormState,
} from "@/lib/forms";
import {
  SupplierSchema,
  SupplierIngredientSchema,
  AssignStoresSchema,
} from "@/lib/suppliers/schemas";

const PATH = "/admin/katalog/dodavatelia";

export async function saveSupplier(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole(Role.SUPERADMIN);

  const id = strOrUndefined(formData.get("id"));
  const parsed = SupplierSchema.safeParse({
    name: formData.get("name"),
    contactName: formData.get("contactName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    ico: formData.get("ico"),
    dic: formData.get("dic"),
    notes: formData.get("notes"),
    isActive: formData.get("isActive"),
  });
  if (!parsed.success) {
    return { ok: false, errors: flattenZodError(parsed.error), values: rawValues(formData) };
  }

  const d = parsed.data;
  try {
    const data = {
      name: d.name,
      contactName: d.contactName ?? null,
      email: d.email ?? null,
      phone: d.phone ?? null,
      address: d.address ?? null,
      ico: d.ico ?? null,
      dic: d.dic ?? null,
      notes: d.notes ?? null,
      isActive: d.isActive,
    };
    if (id) {
      await prisma.supplier.update({ where: { id }, data });
    } else {
      await prisma.supplier.create({ data });
    }
  } catch {
    return { ok: false, message: "Dodávateľa sa nepodarilo uložiť.", values: rawValues(formData) };
  }

  revalidatePath(PATH);
  return { ok: true };
}

export async function deleteSupplier(id: string): Promise<FormState> {
  await requireRole(Role.SUPERADMIN);

  try {
    await prisma.supplier.delete({ where: { id } });
  } catch {
    return { ok: false, message: "Dodávateľa sa nepodarilo zmazať." };
  }

  revalidatePath(PATH);
  return { ok: true };
}

/** Priradí dodávateľa vybraným predajňam (M:N, spravuje centrála). */
export async function assignSupplierStores(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole(Role.SUPERADMIN);

  const storeIds = formData.getAll("storeIds").map(String);
  const parsed = AssignStoresSchema.safeParse({
    supplierId: formData.get("supplierId"),
    storeIds,
  });
  if (!parsed.success) {
    return { ok: false, errors: flattenZodError(parsed.error) };
  }

  const { supplierId, storeIds: ids } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.storeSupplier.deleteMany({ where: { supplierId } });
      if (ids.length > 0) {
        await tx.storeSupplier.createMany({
          data: ids.map((storeId) => ({ supplierId, storeId })),
        });
      }
    });
  } catch {
    return { ok: false, message: "Priradenie predajní sa nepodarilo." };
  }

  revalidatePath(`${PATH}/${supplierId}`);
  revalidatePath(PATH);
  return { ok: true };
}

export async function saveSupplierIngredient(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole(Role.SUPERADMIN);

  const id = strOrUndefined(formData.get("id"));
  const parsed = SupplierIngredientSchema.safeParse({
    storeId: formData.get("storeId"),
    supplierId: formData.get("supplierId"),
    ingredientId: formData.get("ingredientId"),
    sku: formData.get("sku"),
    packageSize: formData.get("packageSize"),
    packageUnit: formData.get("packageUnit"),
    price: formData.get("price"),
    leadTimeDays: formData.get("leadTimeDays"),
    isPreferred: formData.get("isPreferred"),
  });
  if (!parsed.success) {
    return { ok: false, errors: flattenZodError(parsed.error), values: rawValues(formData) };
  }

  const d = parsed.data;

  // Predajňa musí mať schváleného dodávateľa.
  const link = await prisma.storeSupplier.findUnique({
    where: { storeId_supplierId: { storeId: d.storeId, supplierId: d.supplierId } },
  });
  if (!link?.isActive) {
    return {
      ok: false,
      errors: { storeId: ["Dodávateľ nie je priradený k tejto predajni."] },
      values: rawValues(formData),
    };
  }

  const ingredient = await prisma.ingredient.findUnique({
    where: { id: d.ingredientId },
    select: { isActive: true },
  });
  if (!ingredient?.isActive) {
    return { ok: false, errors: { ingredientId: ["Neplatná surovina."] }, values: rawValues(formData) };
  }

  try {
    const data = {
      sku: d.sku ?? null,
      packageSize: d.packageSize ?? null,
      packageUnit: d.packageUnit ?? null,
      price: d.price ?? null,
      leadTimeDays: d.leadTimeDays ?? null,
      isPreferred: d.isPreferred,
    };
    if (id) {
      await prisma.supplierIngredient.update({ where: { id }, data });
    } else {
      await prisma.supplierIngredient.create({
        data: {
          storeId: d.storeId,
          supplierId: d.supplierId,
          ingredientId: d.ingredientId,
          ...data,
        },
      });
    }
  } catch (err) {
    if (isUniqueViolation(err)) {
      return {
        ok: false,
        message: "Táto surovina už v cenníku pre danú predajňu existuje.",
      };
    }
    return { ok: false, message: "Položku cenníka sa nepodarilo uložiť.", values: rawValues(formData) };
  }

  revalidatePath(`${PATH}/${d.supplierId}`);
  return { ok: true };
}

export async function deleteSupplierIngredient(id: string): Promise<FormState> {
  await requireRole(Role.SUPERADMIN);

  const row = await prisma.supplierIngredient.findUnique({
    where: { id },
    select: { supplierId: true },
  });
  if (!row) return { ok: false, message: "Položka cenníka neexistuje." };

  try {
    await prisma.supplierIngredient.delete({ where: { id } });
  } catch {
    return { ok: false, message: "Položku cenníka sa nepodarilo zmazať." };
  }

  revalidatePath(`${PATH}/${row.supplierId}`);
  return { ok: true };
}
