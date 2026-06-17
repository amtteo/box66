import * as z from "zod";

import { UnitOfMeasure } from "@/generated/prisma/enums";

const emptyToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

const optionalText = z.preprocess(
  emptyToUndefined,
  z.string().trim().max(160).optional(),
);

const optionalLongText = z.preprocess(
  emptyToUndefined,
  z.string().trim().max(4000).optional(),
);

const checkbox = z.preprocess(
  (v) => v === "on" || v === "true" || v === true,
  z.boolean(),
);

export const RecipeSchema = z.object({
  productId: z.uuid({ error: "Vyber produkt." }),
  name: optionalText,
  yield: z.preprocess(
    (v) => (v === "" || v == null ? 1 : v),
    z.coerce
      .number({ error: "Zadaj počet porcií." })
      .int({ error: "Zadaj celé číslo." })
      .min(1, { error: "Aspoň 1 porcia." })
      .max(10000),
  ),
  instructions: optionalLongText,
  isActive: checkbox,
});

export const UpdateRecipeSchema = RecipeSchema.omit({ productId: true });

export const RecipeItemSchema = z.object({
  recipeId: z.uuid(),
  ingredientId: z.uuid({ error: "Vyber surovinu." }),
  quantity: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce
      .number({ error: "Zadaj množstvo." })
      .gt(0, { error: "Množstvo musí byť kladné." })
      .max(9_999_999.999),
  ),
  unit: z.enum(UnitOfMeasure, { error: "Vyber jednotku." }),
  notes: z.preprocess(emptyToUndefined, z.string().trim().max(300).optional()),
});

export type RecipeInput = z.infer<typeof RecipeSchema>;
export type RecipeItemInput = z.infer<typeof RecipeItemSchema>;
