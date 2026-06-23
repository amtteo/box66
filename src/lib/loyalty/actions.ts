"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { Role, requireRole } from "@/lib/auth/dal";
import {
  flattenZodError,
  rawValues,
  strOrUndefined,
  type FormState,
} from "@/lib/forms";
import { LoyaltyRewardSchema } from "@/lib/loyalty/schemas";

const REWARDS_PATH = "/admin/odmeny";

export async function saveLoyaltyReward(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole(Role.SUPERADMIN);

  const id = strOrUndefined(formData.get("id"));
  const isActive = formData.get("isActive") === "on";
  const parsed = LoyaltyRewardSchema.safeParse({
    productId: formData.get("productId"),
    pointsCost: formData.get("pointsCost"),
    sortOrder: formData.get("sortOrder"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      errors: flattenZodError(parsed.error),
      values: rawValues(formData),
    };
  }

  const d = parsed.data;

  const product = await prisma.product.findUnique({
    where: { id: d.productId },
    select: {
      id: true,
      isActive: true,
      _count: { select: { choiceGroups: true } },
      loyaltyReward: { select: { id: true } },
    },
  });
  if (!product) {
    return {
      ok: false,
      message: "Produkt neexistuje.",
      values: rawValues(formData),
    };
  }
  if (product._count.choiceGroups > 0) {
    return {
      ok: false,
      message: "Kombo produkt nemôže byť odmenou.",
      values: rawValues(formData),
    };
  }
  if (product.loyaltyReward && product.loyaltyReward.id !== id) {
    return {
      ok: false,
      message: "Tento produkt už je priradený ako odmena.",
      values: rawValues(formData),
    };
  }

  try {
    if (id) {
      await prisma.loyaltyReward.update({
        where: { id },
        data: {
          productId: d.productId,
          pointsCost: d.pointsCost,
          sortOrder: d.sortOrder,
          isActive,
        },
      });
    } else {
      await prisma.loyaltyReward.create({
        data: {
          productId: d.productId,
          pointsCost: d.pointsCost,
          sortOrder: d.sortOrder,
          isActive,
        },
      });
    }
  } catch {
    return {
      ok: false,
      message: "Odmenu sa nepodarilo uložiť.",
      values: rawValues(formData),
    };
  }

  revalidatePath(REWARDS_PATH);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteLoyaltyReward(id: string): Promise<FormState> {
  await requireRole(Role.SUPERADMIN);

  try {
    await prisma.loyaltyReward.delete({ where: { id } });
  } catch {
    return { ok: false, message: "Odmenu sa nepodarilo zmazať." };
  }

  revalidatePath(REWARDS_PATH);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function toggleLoyaltyReward(
  id: string,
  isActive: boolean,
): Promise<FormState> {
  await requireRole(Role.SUPERADMIN);

  try {
    await prisma.loyaltyReward.update({
      where: { id },
      data: { isActive },
    });
  } catch {
    return { ok: false, message: "Stav odmeny sa nepodarilo zmeniť." };
  }

  revalidatePath(REWARDS_PATH);
  revalidatePath("/", "layout");
  return { ok: true };
}
