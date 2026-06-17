import type { Metadata } from "next";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

import { getStoreContact } from "@/lib/menu/presentation";

export const metadata: Metadata = {
  title: "Kontakt",
  description: "Kontaktné údaje a otváracie hodiny prevádzky Box66.",
};

/** Bezpečne prečíta otváracie hodiny z JSON poľa (deň → hodiny), ak existuje. */
function readOpeningHours(value: unknown): { day: string; hours: string }[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => typeof v === "string")
    .map(([day, v]) => ({ day, hours: v as string }));
}

export default async function ContactPage() {
  const store = await getStoreContact();

  const addressLine = store
    ? [store.street, [store.postalCode, store.city].filter(Boolean).join(" ")]
        .filter(Boolean)
        .join(", ")
    : null;
  const openingHours = readOpeningHours(store?.openingHours);
  const mapsQuery = encodeURIComponent(
    [store?.name, addressLine].filter(Boolean).join(", "),
  );

  return (
    <>
      <section className="border-b bg-muted/30">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Kontakt
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Ozvite sa nám
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Máte otázku k objednávke alebo k nášmu menu? Radi pomôžeme.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-5 rounded-xl border bg-card p-6">
            <h2 className="text-lg font-medium">{store?.name ?? "Box66"}</h2>
            <ul className="space-y-4 text-sm">
              {addressLine && (
                <li className="flex items-start gap-3">
                  <MapPin className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                  <span>{addressLine}</span>
                </li>
              )}
              {store?.phone && (
                <li className="flex items-center gap-3">
                  <Phone className="size-5 shrink-0 text-muted-foreground" />
                  <a
                    href={`tel:${store.phone}`}
                    className="hover:text-foreground hover:underline"
                  >
                    {store.phone}
                  </a>
                </li>
              )}
              {store?.email && (
                <li className="flex items-center gap-3">
                  <Mail className="size-5 shrink-0 text-muted-foreground" />
                  <a
                    href={`mailto:${store.email}`}
                    className="hover:text-foreground hover:underline"
                  >
                    {store.email}
                  </a>
                </li>
              )}
            </ul>

            {addressLine && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex text-sm font-medium text-primary hover:underline"
              >
                Zobraziť na mape →
              </a>
            )}

            {!store && (
              <p className="text-sm text-muted-foreground">
                Kontaktné údaje budú čoskoro doplnené.
              </p>
            )}
          </div>

          <div className="space-y-4 rounded-xl border bg-card p-6">
            <h2 className="flex items-center gap-2 text-lg font-medium">
              <Clock className="size-5 text-muted-foreground" />
              Otváracie hodiny
            </h2>
            {openingHours.length > 0 ? (
              <ul className="divide-y text-sm">
                {openingHours.map(({ day, hours }) => (
                  <li key={day} className="flex justify-between py-2">
                    <span className="text-muted-foreground">{day}</span>
                    <span className="font-medium tabular-nums">{hours}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Otváracie hodiny zatiaľ neboli zverejnené. Zavolajte nám alebo
                objednávajte online kedykoľvek.
              </p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
