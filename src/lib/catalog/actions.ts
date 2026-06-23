"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole, Role } from "@/lib/auth/dal";
import {
  CategorySchema,
  ProductSchema,
  IngredientSchema,
  type CatalogFormState,
} from "@/lib/catalog/schemas";
import { slugify, uniqueSlug } from "@/lib/catalog/slug";
import {
  deleteCatalogImageByUrl,
  isUploadedFile,
  uploadCatalogImage,
} from "@/lib/catalog/storage";

const CATEGORIES_PATH = "/admin/katalog/kategorie";
const PRODUCTS_PATH = "/admin/katalog/produkty";
const INGREDIENTS_PATH = "/admin/katalog/ingrediencie";

// ── Kategórie ────────────────────────────────────────────────────────────

export async function saveCategory(
  _prev: CatalogFormState,
  formData: FormData,
): Promise<CatalogFormState> {
  await requireRole(Role.SUPERADMIN);

  const id = strOrUndefined(formData.get("id"));
  const parsed = CategorySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    sortOrder: formData.get("sortOrder"),
    isActive: formData.get("isActive"),
    isChoicePool: formData.get("isChoicePool"),
    showInStorefront: formData.get("showInStorefront"),
  });

  if (!parsed.success) {
    return { ok: false, errors: z_flatten(parsed.error), values: rawValues(formData) };
  }

  const image = await resolveImageUrl(formData, "categories");
  if (!image.ok) {
    return { ok: false, message: image.error, values: rawValues(formData) };
  }

  const { name, description, sortOrder, isActive, isChoicePool, showInStorefront } =
    parsed.data;
  const slug = await uniqueSlug(parsed.data.slug ?? slugify(name), async (c) => {
    const found = await prisma.category.findUnique({
      where: { slug: c },
      select: { id: true },
    });
    return !!found && found.id !== id;
  });

  try {
    const data = {
      name,
      slug,
      description: description ?? null,
      imageUrl: image.url,
      sortOrder,
      isActive,
      isChoicePool,
      showInStorefront,
    };
    if (id) {
      await prisma.category.update({ where: { id }, data });
    } else {
      await prisma.category.create({ data });
    }
  } catch {
    return {
      ok: false,
      message: "Kategóriu sa nepodarilo uložiť. Skús to znova.",
      values: rawValues(formData),
    };
  }

  revalidatePath(CATEGORIES_PATH);
  revalidatePath(PRODUCTS_PATH);
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<CatalogFormState> {
  await requireRole(Role.SUPERADMIN);

  try {
    const category = await prisma.category.findUnique({
      where: { id },
      select: { imageUrl: true, _count: { select: { products: true } } },
    });
    if (!category) return { ok: false, message: "Kategória neexistuje." };
    if (category._count.products > 0) {
      return {
        ok: false,
        message: "Kategóriu nemožno zmazať — obsahuje produkty.",
      };
    }
    await prisma.category.delete({ where: { id } });
    if (category.imageUrl) await deleteCatalogImageByUrl(category.imageUrl);
  } catch {
    return { ok: false, message: "Kategóriu sa nepodarilo zmazať." };
  }

  revalidatePath(CATEGORIES_PATH);
  return { ok: true };
}

// ── Produkty ─────────────────────────────────────────────────────────────

export async function saveProduct(
  _prev: CatalogFormState,
  formData: FormData,
): Promise<CatalogFormState> {
  await requireRole(Role.SUPERADMIN);

  const id = strOrUndefined(formData.get("id"));
  const parsed = ProductSchema.safeParse({
    categoryId: formData.get("categoryId"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    basePrice: formData.get("basePrice"),
    sku: formData.get("sku"),
    allergens: formData.getAll("allergens"),
    kcal: formData.get("kcal"),
    prepMinutes: formData.get("prepMinutes"),
    sortOrder: formData.get("sortOrder"),
    isActive: formData.get("isActive"),
    isComboOption: formData.get("isComboOption"),
    menuUpsellProductId: formData.get("menuUpsellProductId"),
  });

  if (!parsed.success) {
    return { ok: false, errors: z_flatten(parsed.error), values: rawValues(formData) };
  }

  const image = await resolveImageUrl(formData, "products");
  if (!image.ok) {
    return { ok: false, message: image.error, values: rawValues(formData) };
  }

  const d = parsed.data;
  if (d.menuUpsellProductId && id && d.menuUpsellProductId === id) {
    return {
      ok: false,
      errors: { menuUpsellProductId: ["MENU verzia nemôže byť ten istý produkt."] },
      values: rawValues(formData),
    };
  }
  const slug = await uniqueSlug(d.slug ?? slugify(d.name), async (c) => {
    const found = await prisma.product.findUnique({
      where: { slug: c },
      select: { id: true },
    });
    return !!found && found.id !== id;
  });

  try {
    const data = {
      categoryId: d.categoryId,
      name: d.name,
      slug,
      description: d.description ?? null,
      imageUrl: image.url,
      basePrice: d.basePrice ?? null,
      sku: d.sku ?? null,
      allergens: d.allergens,
      kcal: d.kcal ?? null,
      prepMinutes: d.prepMinutes ?? null,
      sortOrder: d.sortOrder,
      isActive: d.isActive,
      isComboOption: d.isComboOption,
      menuUpsellProductId: d.menuUpsellProductId ?? null,
    };
    if (id) {
      await prisma.product.update({ where: { id }, data });
    } else {
      await prisma.product.create({ data });
    }
  } catch {
    return {
      ok: false,
      message: "Produkt sa nepodarilo uložiť. Skús to znova.",
      values: rawValues(formData),
    };
  }

  revalidatePath(PRODUCTS_PATH);
  return { ok: true };
}

export async function deleteProduct(id: string): Promise<CatalogFormState> {
  await requireRole(Role.SUPERADMIN);

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      select: { imageUrl: true },
    });
    if (!product) return { ok: false, message: "Produkt neexistuje." };
    await prisma.product.delete({ where: { id } });
    if (product.imageUrl) await deleteCatalogImageByUrl(product.imageUrl);
  } catch {
    return {
      ok: false,
      message:
        "Produkt sa nepodarilo zmazať — možno je už použitý v menu alebo receptúre.",
    };
  }

  revalidatePath(PRODUCTS_PATH);
  return { ok: true };
}

// ── Ingrediencie (globálne) ────────────────────────────────────────────────

export async function saveIngredient(
  _prev: CatalogFormState,
  formData: FormData,
): Promise<CatalogFormState> {
  await requireRole(Role.SUPERADMIN);

  const id = strOrUndefined(formData.get("id"));
  const parsed = IngredientSchema.safeParse({
    name: formData.get("name"),
    sku: formData.get("sku"),
    unit: formData.get("unit"),
    notes: formData.get("notes"),
    isActive: formData.get("isActive"),
  });

  if (!parsed.success) {
    return { ok: false, errors: z_flatten(parsed.error), values: rawValues(formData) };
  }

  const image = await resolveImageUrl(formData, "ingredients");
  if (!image.ok) {
    return { ok: false, message: image.error, values: rawValues(formData) };
  }

  const { name, sku, unit, notes, isActive } = parsed.data;

  try {
    const data = {
      name,
      sku: sku ?? null,
      imageUrl: image.url,
      unit,
      notes: notes ?? null,
      isActive,
    };
    if (id) {
      await prisma.ingredient.update({ where: { id }, data });
    } else {
      await prisma.ingredient.create({ data });
    }
  } catch (err) {
    if (isUniqueViolation(err)) {
      return {
        ok: false,
        errors: { name: ["Ingrediencia s týmto názvom už existuje."] },
        values: rawValues(formData),
      };
    }
    return {
      ok: false,
      message: "Ingredienciu sa nepodarilo uložiť. Skús to znova.",
      values: rawValues(formData),
    };
  }

  revalidatePath(INGREDIENTS_PATH);
  return { ok: true };
}

export async function deleteIngredient(id: string): Promise<CatalogFormState> {
  await requireRole(Role.SUPERADMIN);

  try {
    const ingredient = await prisma.ingredient.findUnique({
      where: { id },
      select: { imageUrl: true },
    });
    if (!ingredient) return { ok: false, message: "Ingrediencia neexistuje." };
    await prisma.ingredient.delete({ where: { id } });
    if (ingredient.imageUrl) await deleteCatalogImageByUrl(ingredient.imageUrl);
  } catch {
    return {
      ok: false,
      message:
        "Ingredienciu sa nepodarilo zmazať — možno je použitá v receptúre alebo na sklade.",
    };
  }

  revalidatePath(INGREDIENTS_PATH);
  return { ok: true };
}

// ── Pomocníci ──────────────────────────────────────────────────────────────

type ResolvedImage = { ok: true; url: string | null } | { ok: false; error: string };

/**
 * Vyrieši finálnu hodnotu `imageUrl`: nahrá nový súbor, odstráni starý na
 * žiadosť, alebo ponechá existujúci. Pri nahradení/odstránení zmaže starý súbor.
 */
async function resolveImageUrl(
  formData: FormData,
  folder: string,
): Promise<ResolvedImage> {
  const current = strOrUndefined(formData.get("currentImageUrl")) ?? null;
  const remove = formData.get("removeImage") === "on";
  const file = formData.get("image");

  if (isUploadedFile(file)) {
    const result = await uploadCatalogImage(file, folder);
    if (!result.ok) return { ok: false, error: result.error };
    if (current) await deleteCatalogImageByUrl(current);
    return { ok: true, url: result.url };
  }

  if (remove) {
    if (current) await deleteCatalogImageByUrl(current);
    return { ok: true, url: null };
  }

  return { ok: true, url: current };
}

function strOrUndefined(v: FormDataEntryValue | null): string | undefined {
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? undefined : s;
}

/** Zozbiera textové polia formulára na opätovné vyplnenie po chybe. */
function rawValues(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && key !== "image") out[key] = value;
  }
  return out;
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "P2002"
  );
}

/** Zod chyby do plochej mapy `pole -> [správy]`. */
function z_flatten(error: {
  issues: { path: PropertyKey[]; message: string }[];
}): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    (out[key] ??= []).push(issue.message);
  }
  return out;
}
