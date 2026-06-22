import * as z from "zod";

const emptyToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

const multiplier = z.coerce
  .number({ error: "Zadaj platný koeficient." })
  .min(0.01, { error: "Koeficient musí byť aspoň 0,01." })
  .max(99.9999, { error: "Koeficient je príliš vysoký." });

export const PriceCoefficientSchema = z.object({
  name: z
    .string({ error: "Zadaj názov." })
    .trim()
    .min(2, { error: "Názov musí mať aspoň 2 znaky." })
    .max(80),
  multiplier,
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

export const MenuCustomPriceSchema = z.object({
  menuItemId: z.uuid(),
  customPrice: z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ error: "Zadaj platnú cenu." })
      .min(0, { error: "Cena nemôže byť záporná." })
      .max(99999.99)
      .optional(),
  ),
});

export type PriceCoefficientInput = z.infer<typeof PriceCoefficientSchema>;
