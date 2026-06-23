import * as z from "zod";

export const LoyaltyRewardSchema = z.object({
  productId: z.uuid({ error: "Vyber produkt." }),
  pointsCost: z.coerce
    .number({ error: "Zadaj počet bodov." })
    .int({ error: "Body musia byť celé číslo." })
    .min(1, { error: "Minimálne 1 bod." })
    .max(999_999, { error: "Príliš veľa bodov." }),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

export type LoyaltyRewardInput = z.infer<typeof LoyaltyRewardSchema>;
