import * as z from "zod";

const checkbox = z.preprocess(
  (v) => v === "on" || v === "true" || v === true,
  z.boolean(),
);

const price = z.preprocess(
  (v) => (v === "" || v == null ? undefined : v),
  z.coerce
    .number({ error: "Zadaj platnú cenu." })
    .min(0, { error: "Cena nemôže byť záporná." })
    .max(99999.99),
);

const sortOrder = z.preprocess(
  (v) => (v === "" || v == null ? 0 : v),
  z.coerce.number().int().min(0),
);

export const AddMenuItemSchema = z.object({
  storeId: z.uuid(),
  productId: z.uuid({ error: "Vyber produkt." }),
  price,
  isAvailable: checkbox,
  sortOrder,
});

export const UpdateMenuItemSchema = z.object({
  menuItemId: z.uuid(),
  price,
  isAvailable: checkbox,
  sortOrder,
});

export type AddMenuItemInput = z.infer<typeof AddMenuItemSchema>;
