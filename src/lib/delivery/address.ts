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
