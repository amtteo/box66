import "server-only";

import { geocodeAddress as geocodeAddressGoogle } from "@/lib/delivery/google-geocode";

/** Geokóduje adresu doručenia na súradnice (pre výber predajne). */
export async function geocodeDeliveryAddress(
  address: string,
): Promise<{ ok: true; lat: number; lng: number } | { ok: false; message: string }> {
  const trimmed = address.trim();
  if (trimmed.length < 5) {
    return { ok: false, message: "Zadaj platnú adresu doručenia." };
  }

  try {
    const { lat, lng } = await geocodeAddressGoogle(trimmed);
    return { ok: true, lat, lng };
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Nepodarilo sa overiť adresu.";
    return { ok: false, message: msg };
  }
}
