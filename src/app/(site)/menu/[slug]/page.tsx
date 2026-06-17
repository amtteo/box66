import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Flame, ImageIcon } from "lucide-react";

import { getDefaultStore } from "@/lib/orders/queries";
import { getPresentationProduct } from "@/lib/menu/presentation";
import { ALLERGENS } from "@/lib/catalog/schemas";
import { formatMoney } from "@/lib/orders/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MenuProductCard } from "@/components/site/menu-product-card";
import { IngredientCompositionStrip } from "@/components/site/ingredient-display";

const ALLERGEN_LABEL = new Map(ALLERGENS.map((a) => [a.code, a.label]));

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const store = await getDefaultStore();
  const product = store ? await getPresentationProduct(store.id, slug) : null;
  if (!product) return { title: "Položka menu" };
  return {
    title: product.name,
    description: product.description ?? `${product.name} — Box66 menu`,
  };
}

export default async function MenuItemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const store = await getDefaultStore();
  const product = store ? await getPresentationProduct(store.id, slug) : null;
  if (!product) notFound();

  const currency = store!.currency;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <Button
        variant="ghost"
        size="sm"
        asChild
        className="-ml-2 mb-6 text-muted-foreground"
      >
        <Link href="/menu">
          <ArrowLeft className="size-4" />
          Späť na menu
        </Link>
      </Button>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl border bg-muted">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <ImageIcon className="size-16 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <Badge variant="secondary" className="mb-3">
              {product.categoryName}
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {product.name}
            </h1>
            <p className="mt-2 text-2xl font-semibold tabular-nums">
              {formatMoney(product.price, currency)}
            </p>
          </div>

          {product.description && (
            <p className="text-muted-foreground">{product.description}</p>
          )}

          <div className="flex flex-wrap gap-3">
            {product.kcal != null && (
              <div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                <Flame className="size-4 text-muted-foreground" />
                <span className="font-medium tabular-nums">
                  {product.kcal} kcal
                </span>
              </div>
            )}
            {product.prepMinutes != null && (
              <div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                <Clock className="size-4 text-muted-foreground" />
                <span className="font-medium tabular-nums">
                  cca {product.prepMinutes} min
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-semibold">Alergény</h2>
            {product.allergens.length > 0 ? (
              <ul className="flex flex-wrap gap-1.5">
                {product.allergens.map((code) => (
                  <li key={code}>
                    <Badge variant="secondary" className="font-normal">
                      {ALLERGEN_LABEL.get(code) ?? code}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Bez deklarovaných alergénov.
              </p>
            )}
          </div>

          <Button asChild size="lg" className="mt-auto w-full sm:w-auto">
            <Link href="/">Objednať v e-shope</Link>
          </Button>
        </div>
      </div>

      {product.ingredients.length > 0 && (
        <section className="mt-12 border-t pt-10 sm:mt-16">
          <h2 className="mb-6 text-xl font-semibold tracking-tight sm:text-2xl">
            Čo je v jedle
          </h2>
          <IngredientCompositionStrip ingredients={product.ingredients} />
        </section>
      )}

      {product.related.length > 0 && (
        <section className="mt-16 space-y-5">
          <h2 className="text-2xl font-semibold tracking-tight">
            Mohlo by vám chutiť
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {product.related.map((item) => (
              <MenuProductCard
                key={item.menuItemId}
                item={item}
                currency={currency}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
