import "server-only";

import Stripe from "stripe";

let cached: Stripe | null = null;

/** Je Stripe nakonfigurovaný (sú doplnené kľúče)? */
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/**
 * Lazy singleton Stripe klienta. Vyhodí zrozumiteľnú chybu, ak chýba kľúč —
 * platba kartou sa potom v UI ponúkne ako nedostupná (zostáva platba v hotovosti).
 */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_NOT_CONFIGURED");
  }
  if (!cached) {
    cached = new Stripe(key, { typescript: true });
  }
  return cached;
}
