import * as z from "zod";

import { UnitOfMeasure } from "@/generated/prisma/enums";

const emptyToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

const optionalText = z.preprocess(
  emptyToUndefined,
  z.string().trim().max(300).optional(),
);

const optionalLongText = z.preprocess(
  emptyToUndefined,
  z.string().trim().max(2000).optional(),
);

const checkbox = z.preprocess(
  (v) => v === "on" || v === "true" || v === true,
  z.boolean(),
);

export const SupplierSchema = z.object({
  name: z
    .string({ error: "Zadaj názov." })
    .trim()
    .min(2, { error: "Názov musí mať aspoň 2 znaky." })
    .max(160),
  contactName: optionalText,
  email: z.preprocess(
    emptyToUndefined,
    z.email({ error: "Zadaj platný e-mail." }).optional(),
  ),
  phone: optionalText,
  address: optionalText,
  ico: optionalText,
  dic: optionalText,
  notes: optionalLongText,
  isActive: checkbox,
});

export const SupplierIngredientSchema = z.object({
  storeId: z.uuid({ error: "Vyber predajňu." }),
  supplierId: z.uuid(),
  ingredientId: z.uuid({ error: "Vyber surovinu." }),
  sku: optionalText,
  packageSize: z.preprocess(
    emptyToUndefined,
    z.coerce.number().gt(0, { error: "Veľkosť balenia musí byť kladná." }).optional(),
  ),
  packageUnit: z.preprocess(
    (v) => (v === "" || v == null || v === "none" ? undefined : v),
    z.enum(UnitOfMeasure).optional(),
  ),
  price: z.preprocess(
    emptyToUndefined,
    z.coerce.number().min(0, { error: "Cena nemôže byť záporná." }).max(999999.99).optional(),
  ),
  leadTimeDays: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(0).max(3650).optional(),
  ),
  isPreferred: checkbox,
});

export const AssignStoresSchema = z.object({
  supplierId: z.uuid(),
  storeIds: z.array(z.uuid()).default([]),
});
