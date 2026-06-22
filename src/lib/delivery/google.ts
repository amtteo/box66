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

export type RouteLatLng = { lat: number; lng: number };

export type RouteEndpoint = string | RouteLatLng;

/** Protobuf Duration z Routes API, napr. "1234s". */
function parseDurationToMinutes(duration: string): number {
  const match = /^(\d+(?:\.\d+)?)s$/.exec(duration.trim());
  if (!match) {
    throw new Error("Neplatný formát trvania trasy.");
  }
  return Math.max(1, Math.ceil(Number(match[1]) / 60));
}

function toRouteWaypoint(endpoint: RouteEndpoint) {
  if (typeof endpoint === "string") {
    return { address: endpoint };
  }
  return {
    location: {
      latLng: {
        latitude: endpoint.lat,
        longitude: endpoint.lng,
      },
    },
  };
}

/**
 * Vzdialenosť a čas jazdy autom cez Google Routes API (`computeRoutes`).
 * Vyžaduje GOOGLE_MAPS_API_KEY a zapnuté Routes API v Google Cloud.
 */
export async function getDrivingRoute(
  origin: RouteEndpoint,
  destination: RouteEndpoint,
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
        origin: toRouteWaypoint(origin),
        destination: toRouteWaypoint(destination),
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
  if (
    route?.distanceMeters == null ||
    route.distanceMeters < 0 ||
    !route.duration
  ) {
    throw new Error("Nepodarilo sa vypočítať trasu k adrese.");
  }

  return {
    distanceKm: Math.round((route.distanceMeters / 1000) * 100) / 100,
    durationMinutes: parseDurationToMinutes(route.duration),
  };
}
