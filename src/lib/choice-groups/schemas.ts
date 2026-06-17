import * as z from "zod";

const emptyToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

const positiveInt = (def: number) =>
  z.preprocess(
    (v) => (v === "" || v == null ? def : v),
    z.coerce
      .number({ error: "Zadaj celé číslo." })
      .int({ error: "Zadaj celé číslo." })
      .min(0, { error: "Hodnota nemôže byť záporná." })
      .max(50),
  );

export const ChoiceGroupSchema = z
  .object({
    productId: z.uuid({ error: "Neplatný produkt." }),
    categoryId: z.uuid({ error: "Vyber kategóriu výberu." }),
    label: z
      .string({ error: "Zadaj názov výberu." })
      .trim()
      .min(2, { error: "Názov musí mať aspoň 2 znaky." })
      .max(120),
    minSelect: positiveInt(1),
    maxSelect: z.preprocess(
      (v) => (v === "" || v == null ? 1 : v),
      z.coerce
        .number({ error: "Zadaj celé číslo." })
        .int({ error: "Zadaj celé číslo." })
        .min(1, { error: "Maximum musí byť aspoň 1." })
        .max(50),
    ),
    sortOrder: z.preprocess(
      (v) => (v === "" || v == null ? 0 : v),
      z.coerce.number().int().min(0).max(9999),
    ),
  })
  .refine((d) => d.maxSelect >= d.minSelect, {
    error: "Maximum nemôže byť menšie ako minimum.",
    path: ["maxSelect"],
  });

export const UpdateChoiceGroupSchema = z.object({
  id: z.uuid(),
  label: z
    .string({ error: "Zadaj názov výberu." })
    .trim()
    .min(2, { error: "Názov musí mať aspoň 2 znaky." })
    .max(120),
  minSelect: positiveInt(1),
  maxSelect: z.preprocess(
    (v) => (v === "" || v == null ? 1 : v),
    z.coerce.number().int().min(1).max(50),
  ),
  sortOrder: z.preprocess(
    (v) => (v === "" || v == null ? 0 : v),
    z.coerce.number().int().min(0).max(9999),
  ),
});

export { emptyToUndefined };
export type ChoiceGroupInput = z.infer<typeof ChoiceGroupSchema>;
