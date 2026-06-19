import * as z from "zod";

const emptyToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

export const SUPPLIER_INQUIRY_CATEGORIES = [
  { value: "potraviny", label: "Potraviny a suroviny" },
  { value: "obaly", label: "Obalové materiály" },
  { value: "ine", label: "Iné" },
] as const;

export const SupplierInquirySchema = z.object({
  companyName: z
    .string({ error: "Zadajte názov firmy." })
    .trim()
    .min(2, { error: "Názov firmy musí mať aspoň 2 znaky." })
    .max(160),
  ico: z
    .string({ error: "Zadajte IČO." })
    .trim()
    .min(2, { error: "Zadajte platné IČO." })
    .max(20),
  contactName: z
    .string({ error: "Zadajte meno kontaktnej osoby." })
    .trim()
    .min(2, { error: "Meno musí mať aspoň 2 znaky." })
    .max(120),
  phone: z
    .string({ error: "Zadajte telefónne číslo." })
    .trim()
    .min(6, { error: "Zadajte platné telefónne číslo." })
    .max(40),
  email: z
    .string({ error: "Zadajte e-mail." })
    .trim()
    .email({ error: "Zadajte platný e-mail." }),
  category: z.enum(
    SUPPLIER_INQUIRY_CATEGORIES.map((c) => c.value) as [
      (typeof SUPPLIER_INQUIRY_CATEGORIES)[number]["value"],
      ...(typeof SUPPLIER_INQUIRY_CATEGORIES)[number]["value"][],
    ],
    { error: "Vyberte kategóriu produktov alebo služieb." },
  ),
  region: z
    .string({ error: "Zadajte región pôsobenia." })
    .trim()
    .min(2, { error: "Región musí mať aspoň 2 znaky." })
    .max(120),
  description: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .min(20, { error: "Popis ponuky musí mať aspoň 20 znakov." })
      .max(2000),
  ),
});
