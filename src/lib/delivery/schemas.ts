import * as z from "zod";

export const DeliveryZoneInputSchema = z.object({
  id: z.uuid().optional(),
  minKm: z.coerce
    .number()
    .min(0, { error: "Min. vzdialenosť musí byť ≥ 0." })
    .max(999, { error: "Max. 999 km." }),
  maxKm: z.coerce
    .number()
    .min(0.01, { error: "Max. vzdialenosť musí byť > 0." })
    .max(999, { error: "Max. 999 km." }),
  price: z.coerce
    .number()
    .min(0, { error: "Cena musí byť ≥ 0." })
    .max(9999, { error: "Max. 9999 €." }),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

export const DeliveryZonesFormSchema = z
  .object({
    zones: z.array(DeliveryZoneInputSchema).max(20),
  })
  .superRefine((data, ctx) => {
    for (const [i, zone] of data.zones.entries()) {
      if (zone.maxKm < zone.minKm) {
        ctx.addIssue({
          code: "custom",
          message: "Max. km musí byť ≥ min. km.",
          path: ["zones", i, "maxKm"],
        });
      }
    }
  });

export const CalculateDeliverySchema = z
  .object({
    storeId: z.uuid(),
    deliveryAddress: z
      .string()
      .trim()
      .min(5, { error: "Zadaj platnú adresu doručenia." })
      .max(500),
    deliveryLat: z.number().finite().min(-90).max(90).optional(),
    deliveryLng: z.number().finite().min(-180).max(180).optional(),
  })
  .superRefine((data, ctx) => {
    const hasLat = data.deliveryLat != null;
    const hasLng = data.deliveryLng != null;
    if (hasLat !== hasLng) {
      ctx.addIssue({
        code: "custom",
        message: "Súradnice doručenia musia byť zadané spolu.",
        path: ["deliveryLat"],
      });
    }
  });

export type DeliveryZoneInput = z.infer<typeof DeliveryZoneInputSchema>;
