import type { Metadata } from "next";

import { getDefaultStore } from "@/lib/orders/queries";
import { getPresentationMenu } from "@/lib/menu/presentation";
import { MenuProductCard } from "@/components/site/menu-product-card";

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
      <section className="border-b bg-muted/30">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Naše menu
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Vyberte si svoj box
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Každé jedlo pripravujeme z čerstvých surovín. Kliknutím na položku
            zobrazíte zloženie, alergény aj energetické hodnoty.
          </p>
        </div>
      </section>

      {categories.length === 0 ? (
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
            Menu zatiaľ nie je dostupné. Skúste to neskôr.
          </div>
        </div>
      ) : (
        <>
          <nav className="sticky top-16 z-30 border-b bg-background/90 backdrop-blur">
            <div className="mx-auto flex w-full max-w-6xl gap-1 overflow-x-auto px-4 py-3 sm:px-6">
              {categories.map((category) => (
                <a
                  key={category.id}
                  href={`#kat-${category.id}`}
                  className="shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  {category.name}
                </a>
              ))}
            </div>
          </nav>

          <div className="mx-auto w-full max-w-6xl space-y-14 px-4 py-12 sm:px-6">
            {categories.map((category) => (
              <section
                key={category.id}
                id={`kat-${category.id}`}
                className="scroll-mt-32 space-y-5"
              >
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">
                    {category.name}
                  </h2>
                  {category.description && (
                    <p className="mt-1 text-muted-foreground">
                      {category.description}
                    </p>
                  )}
                </div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {category.items.map((item) => (
                    <MenuProductCard
                      key={item.menuItemId}
                      item={item}
                      currency={currency}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </>
  );
}
