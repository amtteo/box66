import "server-only";

type GeocodeResponse = {
  status: string;
  results?: {
    geometry?: { location?: { lat: number; lng: number } };
  }[];
  error_message?: string;
};

/** Geokóduje textovú adresu cez Google Geocoding API (SK). */
export async function geocodeAddress(
  address: string,
): Promise<{ lat: number; lng: number }> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_MAPS_API_KEY nie je nastavený.");
  }

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", address);
  url.searchParams.set("region", "sk");
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString(), { next: { revalidate: 0 } });
  if (!res.ok) {
    throw new Error("Geocoding API zlyhalo.");
  }

  const data = (await res.json()) as GeocodeResponse;
  if (data.status !== "OK" || !data.results?.[0]?.geometry?.location) {
    throw new Error(
      data.error_message ?? "Adresu sa nepodarilo nájsť na mape.",
    );
  }

  const { lat, lng } = data.results[0].geometry.location;
  return { lat, lng };
}
