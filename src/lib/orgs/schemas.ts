import * as z from "zod";

const emptyToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

const optionalText = z.preprocess(
  emptyToUndefined,
  z.string().trim().max(300).optional(),
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

export const OrganizationSchema = z.object({
  name: z
    .string({ error: "Zadaj názov." })
    .trim()
    .min(2, { error: "Názov musí mať aspoň 2 znaky." })
    .max(160),
  slug: optionalSlug,
  legalName: optionalText,
  ico: optionalText,
  dic: optionalText,
  icDph: optionalText,
  email: z.preprocess(
    emptyToUndefined,
    z.email({ error: "Zadaj platný e-mail." }).optional(),
  ),
  phone: optionalText,
  address: optionalText,
  city: optionalText,
  postalCode: optionalText,
  country: z.preprocess(emptyToUndefined, z.string().trim().max(2).optional()),
  isActive: checkbox,
});

export const AssignAdminSchema = z.object({
  organizationId: z.uuid({ error: "Neplatná organizácia." }),
  email: z.email({ error: "Zadaj platný e-mail používateľa." }),
});

export type OrganizationInput = z.infer<typeof OrganizationSchema>;
