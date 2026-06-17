import type { Metadata } from "next";

import { getDefaultStore } from "@/lib/orders/queries";
import { getPresentationMenu } from "@/lib/menu/presentation";
import { MenuPresentationBoard } from "@/components/site/menu-presentation-board";
import { MenuOrderBanner } from "@/components/site/menu-order-banner";

export const metadata: Metadata = {
  title: "Menu",
  description:
    "Objavte ponuku Box66 — burgre, prílohy, nápoje a ďalšie. Zloženie, alergény a energetické hodnoty pri každom jedle.",
};

export default async function MenuPage() {
  const store = await getDefaultStore();
  const categories = store ? await getPresentationMenu(store.id) : [];
  const currency = store?.currency ?? "EUR";

  return (
    <>
      <MenuPresentationBoard categories={categories} currency={currency} />
      <MenuOrderBanner />
    </>
  );
}
