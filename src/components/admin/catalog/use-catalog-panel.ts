"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { CatalogPanelType } from "@/components/admin/catalog/catalog-panel-url";

export function useCatalogPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const panel = searchParams.get("panel") as CatalogPanelType | null;
  const item = searchParams.get("item");

  const openPanel = useCallback(
    (nextPanel: CatalogPanelType, nextItem?: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("panel", nextPanel);
      if (nextItem) {
        params.set("item", nextItem);
      } else {
        params.delete("item");
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const closePanel = useCallback(() => {
    router.push(pathname);
  }, [pathname, router]);

  return { panel, item, openPanel, closePanel };
}
