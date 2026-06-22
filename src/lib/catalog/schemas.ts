import * as z from "zod";

import { UnitOfMeasure } from "@/generated/prisma/enums";

/** Spoločný stav formulárov katalógu pre `useActionState`. */
export type CatalogFormState =
  | {
      ok?: boolean;
      errors?: Record<string, string[]>;
      message?: string;
      values?: Record<string, string>;
    }
  | undefined;

/** Slovenské popisky merných jednotiek pre UI. */
export const UNIT_LABEL: Record<UnitOfMeasure, string> = {
  [UnitOfMeasure.G]: "gram (g)",
  [UnitOfMeasure.KG]: "kilogram (kg)",
  [UnitOfMeasure.ML]: "mililiter (ml)",
  [UnitOfMeasure.L]: "liter (l)",
  [UnitOfMeasure.PCS]: "kus (ks)",
};

export const UNIT_VALUES = Object.values(UnitOfMeasure) as UnitOfMeasure[];

/** Zoznam 14 zákonných alergénov (EÚ) — kód pre uloženie + SK popis. */
export const ALLERGENS: { code: string; label: string }[] = [
  { code: "gluten", label: "Obilniny s lepkom" },
  { code: "crustaceans", label: "Kôrovce" },
  { code: "eggs", label: "Vajcia" },
  { code: "fish", label: "Ryby" },
  { code: "peanuts", label: "Arašidy" },
  { code: "soy", label: "Sója" },
  { code: "milk", label: "Mlieko" },
  { code: "nuts", label: "Orechy" },
  { code: "celery", label: "Zeler" },
  { code: "mustard", label: "Horčica" },
  { code: "sesame", label: "Sezam" },
  { code: "sulphites", label: "Oxid siričitý a siričitany" },
  { code: "lupin", label: "Vlčí bôb" },
  { code: "molluscs", label: "Mäkkýše" },
];

const ALLERGEN_CODES = ALLERGENS.map((a) => a.code) as [string, ...string[]];

// ── Pomocné transformácie z FormData (reťazce) ─────────────────────────────

const emptyToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

const optionalText = z.preprocess(
  emptyToUndefined,
  z.string().trim().max(2000).optional(),
);

const optionalShortText = z.preprocess(
  emptyToUndefined,
  z.string().trim().max(200).optional(),
);

const optionalNonNegativeInt = z.preprocess(
  emptyToUndefined,
  z.coerce
    .number({ error: "Zadaj celé číslo." })
    .int({ error: "Zadaj celé číslo." })
    .min(0, { error: "Hodnota nemôže byť záporná." })
    .optional(),
);

const sortOrder = z.preprocess(
  (v) => (v === "" || v == null ? 0 : v),
  z.coerce
    .number({ error: "Zadaj celé číslo." })
    .int({ error: "Zadaj celé číslo." })
    .min(0, { error: "Hodnota nemôže byť záporná." }),
);

const checkbox = z.preprocess(
  (v) => v === "on" || v === "true" || v === true,
  z.boolean(),
);

const optionalSlug = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      error: "Slug môže obsahovať len malé písmená, číslice a pomlčky.",
    })
    .max(120)
    .optional(),
);

// ── Schémy ─────────────────────────────────────────────────────────────────

export const CategorySchema = z.object({
  name: z
    .string({ error: "Zadaj názov." })
    .trim()
    .min(2, { error: "Názov musí mať aspoň 2 znaky." })
    .max(120),
  slug: optionalSlug,
  description: optionalText,
  imageUrl: optionalShortText,
  sortOrder,
  isActive: checkbox,
  isChoicePool: checkbox,
});

export const ProductSchema = z.object({
  categoryId: z.uuid({ error: "Vyber kategóriu." }),
  name: z
    .string({ error: "Zadaj názov." })
    .trim()
    .min(2, { error: "Názov musí mať aspoň 2 znaky." })
    .max(160),
  slug: optionalSlug,
  description: optionalText,
  imageUrl: optionalShortText,
  basePrice: z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ error: "Zadaj platnú cenu." })
      .min(0, { error: "Cena nemôže byť záporná." })
      .max(99999.99)
      .optional(),
  ),
  sku: optionalShortText,
  allergens: z.array(z.enum(ALLERGEN_CODES)).default([]),
  kcal: optionalNonNegativeInt,
  prepMinutes: optionalNonNegativeInt,
  sortOrder,
  isActive: checkbox,
  isComboOption: checkbox,
  menuUpsellProductId: z.preprocess(
    (v) => (v === "__none__" || v === "" || v == null ? undefined : v),
    z.uuid({ error: "Vyber platný MENU produkt." }).optional(),
  ),
});

export const IngredientSchema = z.object({
  name: z
    .string({ error: "Zadaj názov." })
    .trim()
    .min(2, { error: "Názov musí mať aspoň 2 znaky." })
    .max(160),
  sku: optionalShortText,
  unit: z.enum(UnitOfMeasure, { error: "Vyber mernú jednotku." }),
  notes: optionalText,
  isActive: checkbox,
});

export type CategoryInput = z.infer<typeof CategorySchema>;
export type ProductInput = z.infer<typeof ProductSchema>;
export type IngredientInput = z.infer<typeof IngredientSchema>;
