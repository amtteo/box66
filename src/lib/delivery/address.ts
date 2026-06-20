/** Zloží jednoriadkovú adresu predajne pre Google Distance Matrix. */
export function formatStoreAddress(store: {
  street?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
}): string | null {
  const parts = [
    store.street?.trim(),
    [store.postalCode?.trim(), store.city?.trim()].filter(Boolean).join(" "),
    store.country?.trim() || "Slovensko",
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

/** Ulica a číslo z Google formátovanej adresy (prvá časť pred čiarkou). */
export function extractStreetFromAddress(address: string): string {
  const trimmed = address.trim();
  if (!trimmed) return "";
  const street = trimmed.split(",")[0]?.trim();
  return street || trimmed;
}

type StoreAddressFields = {
  street?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
};

/** Ulica predajne na zobrazenie — nikdy názov prevádzky. */
export function getStoreStreetLine(store: StoreAddressFields): string {
  const street = store.street?.trim();
  if (street) return street;

  const formatted = formatStoreAddress(store);
  if (formatted) return extractStreetFromAddress(formatted);

  const cityLine = [store.postalCode?.trim(), store.city?.trim()]
    .filter(Boolean)
    .join(" ");
  return cityLine;
}
