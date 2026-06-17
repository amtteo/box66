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
  RecipeSchema,
  UpdateRecipeSchema,
  RecipeItemSchema,
} from "@/lib/recipes/schemas";

const PRODUCTS_PATH = "/admin/katalog/produkty";

function recipePath(productId: string) {
  return `${PRODUCTS_PATH}/${productId}/receptura`;
}

async function revalidateRecipe(productId: string, recipeId?: string) {
  revalidatePath(PRODUCTS_PATH);
  revalidatePath(recipePath(productId));
  if (recipeId) {
    revalidatePath(`/admin/katalog/receptury/${recipeId}`);
  }
}

export async function saveRecipe(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole(Role.SUPERADMIN);

  const id = strOrUndefined(formData.get("id"));

  if (id) {
    const parsed = UpdateRecipeSchema.safeParse({
      name: formData.get("name"),
      yield: formData.get("yield"),
      instructions: formData.get("instructions"),
      isActive: formData.get("isActive"),
    });
    if (!parsed.success) {
      return { ok: false, errors: flattenZodError(parsed.error), values: rawValues(formData) };
    }

    let productId: string;
    try {
      const updated = await prisma.recipe.update({
        where: { id },
        data: {
          name: parsed.data.name ?? null,
          yield: parsed.data.yield,
          instructions: parsed.data.instructions ?? null,
          isActive: parsed.data.isActive,
        },
        select: { productId: true },
      });
      productId = updated.productId;
    } catch {
      return { ok: false, message: "Receptúru sa nepodarilo uložiť.", values: rawValues(formData) };
    }

    await revalidateRecipe(productId, id);
    return { ok: true };
  }

  const parsed = RecipeSchema.safeParse({
    productId: formData.get("productId"),
    name: formData.get("name"),
    yield: formData.get("yield"),
    instructions: formData.get("instructions"),
    isActive: formData.get("isActive"),
  });
  if (!parsed.success) {
    return { ok: false, errors: flattenZodError(parsed.error), values: rawValues(formData) };
  }

  const product = await prisma.product.findUnique({
    where: { id: parsed.data.productId },
    select: { isActive: true },
  });
  if (!product || !product.isActive) {
    return { ok: false, errors: { productId: ["Neplatný alebo neaktívny produkt."] } };
  }

  try {
    await prisma.recipe.create({
      data: {
        productId: parsed.data.productId,
        name: parsed.data.name ?? null,
        yield: parsed.data.yield,
        instructions: parsed.data.instructions ?? null,
        isActive: parsed.data.isActive,
      },
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      return { ok: false, message: "Pre tento produkt už globálna receptúra existuje." };
    }
    return { ok: false, message: "Receptúru sa nepodarilo vytvoriť.", values: rawValues(formData) };
  }

  await revalidateRecipe(parsed.data.productId);
  return { ok: true };
}

export async function deleteRecipe(id: string): Promise<FormState> {
  await requireRole(Role.SUPERADMIN);

  const existing = await prisma.recipe.findUnique({
    where: { id },
    select: { productId: true },
  });
  if (!existing) return { ok: false, message: "Receptúra neexistuje." };

  try {
    await prisma.recipe.delete({ where: { id } });
  } catch {
    return { ok: false, message: "Receptúru sa nepodarilo zmazať." };
  }

  await revalidateRecipe(existing.productId, id);
  return { ok: true };
}

export async function saveRecipeItem(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole(Role.SUPERADMIN);

  const id = strOrUndefined(formData.get("id"));
  const parsed = RecipeItemSchema.safeParse({
    recipeId: formData.get("recipeId"),
    ingredientId: formData.get("ingredientId"),
    quantity: formData.get("quantity"),
    unit: formData.get("unit"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { ok: false, errors: flattenZodError(parsed.error), values: rawValues(formData) };
  }

  const d = parsed.data;

  const ingredient = await prisma.ingredient.findUnique({
    where: { id: d.ingredientId },
    select: { isActive: true },
  });
  if (!ingredient?.isActive) {
    return { ok: false, errors: { ingredientId: ["Neplatná surovina."] }, values: rawValues(formData) };
  }

  try {
    const data = {
      quantity: d.quantity,
      unit: d.unit,
      notes: d.notes ?? null,
    };
    if (id) {
      await prisma.recipeItem.update({ where: { id }, data });
    } else {
      await prisma.recipeItem.create({
        data: { recipeId: d.recipeId, ingredientId: d.ingredientId, ...data },
      });
    }
  } catch (err) {
    if (isUniqueViolation(err)) {
      return { ok: false, message: "Táto surovina už v receptúre je." };
    }
    return { ok: false, message: "Položku receptúry sa nepodarilo uložiť.", values: rawValues(formData) };
  }

  const recipe = await prisma.recipe.findUnique({
    where: { id: d.recipeId },
    select: { productId: true },
  });
  if (recipe) await revalidateRecipe(recipe.productId, d.recipeId);
  return { ok: true };
}

export async function deleteRecipeItem(id: string): Promise<FormState> {
  await requireRole(Role.SUPERADMIN);

  const row = await prisma.recipeItem.findUnique({
    where: { id },
    select: { recipeId: true },
  });
  if (!row) return { ok: false, message: "Položka neexistuje." };

  try {
    await prisma.recipeItem.delete({ where: { id } });
  } catch {
    return { ok: false, message: "Položku sa nepodarilo zmazať." };
  }

  const recipe = await prisma.recipe.findUnique({
    where: { id: row.recipeId },
    select: { productId: true },
  });
  if (recipe) await revalidateRecipe(recipe.productId, row.recipeId);
  return { ok: true };
}
