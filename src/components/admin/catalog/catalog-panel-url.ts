export type CatalogPanelType = "category" | "product" | "recipe" | "ingredient";

export function catalogPanelHref(
  pathname: string,
  panel: CatalogPanelType,
  item?: string,
) {
  const params = new URLSearchParams();
  params.set("panel", panel);
  if (item) params.set("item", item);
  return `${pathname}?${params.toString()}`;
}
