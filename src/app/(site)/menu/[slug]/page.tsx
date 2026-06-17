import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getDefaultStore } from "@/lib/orders/queries";
import { getPresentationProduct } from "@/lib/menu/presentation";
import { Button } from "@/components/ui/button";
import { MenuProductDetail } from "@/components/site/menu-product-detail";

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

      <MenuProductDetail
        product={product}
        categoryName={product.categoryName}
        currency={currency}
      />
    </div>
  );
}
