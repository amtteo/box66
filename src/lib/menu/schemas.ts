import * as z from "zod";

const checkbox = z.preprocess(
  (v) => v === "on" || v === "true" || v === true,
  z.boolean(),
);

export const AddMenuItemSchema = z.object({
  storeId: z.uuid(),
  productId: z.uuid({ error: "Vyber produkt." }),
  isAvailable: checkbox,
});

export const ToggleMenuItemAvailabilitySchema = z.object({
  menuItemId: z.uuid(),
  isAvailable: checkbox,
});

export type AddMenuItemInput = z.infer<typeof AddMenuItemSchema>;
