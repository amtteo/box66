import "server-only";

type ComputeRoutesResponse = {
  routes?: {
    distanceMeters?: number;
    duration?: string;
    staticDuration?: string;
  }[];
  error?: { message?: string; status?: string };
};

export type DrivingRouteResult = {
  distanceKm: number;
  /** Odhadovaný čas jazdy v minútach (zaokrúhlené nahor). */
  durationMinutes: number;
};

/** Protobuf Duration z Routes API, napr. "1234s". */
function parseDurationToMinutes(duration: string): number {
  const match = /^(\d+(?:\.\d+)?)s$/.exec(duration.trim());
  if (!match) {
    throw new Error("Neplatný formát trvania trasy.");
  }
  return Math.max(1, Math.ceil(Number(match[1]) / 60));
}

/**
 * Vzdialenosť a čas jazdy autom cez Google Routes API (computeRoutes).
 * Nahradzuje legacy Distance Matrix API.
 * Vyžaduje GOOGLE_MAPS_API_KEY a zapnuté Routes API v Google Cloud.
 */
export async function getDrivingRoute(
  origin: string,
  destination: string,
): Promise<DrivingRouteResult> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_MAPS_API_KEY nie je nastavený.");
  }

  const res = await fetch(
    "https://routes.googleapis.com/directions/v2:computeRoutes",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "routes.duration,routes.distanceMeters",
      },
      body: JSON.stringify({
        origin: { address: origin },
        destination: { address: destination },
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE",
        languageCode: "sk",
        regionCode: "SK",
      }),
      next: { revalidate: 0 },
    },
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      text ? `Routes API zlyhalo: ${text.slice(0, 200)}` : "Routes API zlyhalo.",
    );
  }

  const data = (await res.json()) as ComputeRoutesResponse;
  if (data.error?.message) {
    throw new Error(data.error.message);
  }

  const route = data.routes?.[0];
  if (!route?.distanceMeters || !route.duration) {
    throw new Error("Nepodarilo sa vypočítať trasu k adrese.");
  }

  return {
    distanceKm: Math.round((route.distanceMeters / 1000) * 100) / 100,
    durationMinutes: parseDurationToMinutes(route.duration),
  };
}
