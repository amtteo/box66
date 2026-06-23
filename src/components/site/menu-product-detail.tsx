import Image from "next/image";
import { Flame, ImageIcon, Wheat } from "lucide-react";

import { ALLERGENS } from "@/lib/catalog/schemas";
import { PresentationPrice } from "@/components/site/presentation-price";
import type { PresentationItem } from "@/lib/menu/presentation";
import { IngredientCompositionStrip } from "@/components/site/ingredient-display";
import { cn } from "@/lib/utils";

const ALLERGEN_LABEL = new Map(ALLERGENS.map((a) => [a.code, a.label]));

export function MenuProductDetail({
  product,
  currency,
  compact = false,
  className,
}: {
  product: PresentationItem;
  currency: string;
  compact?: boolean;
  className?: string;
}) {
  const hasKcal = product.kcal != null;
  const hasAllergens = product.allergens.length > 0;
  const allergenLabels = product.allergens.map(
    (code) => ALLERGEN_LABEL.get(code) ?? code,
  );

  return (
    <div className={cn("flex flex-col overflow-y-auto p-4", className)}>
      <div className="relative aspect-[4/4] w-full">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes={compact ? "(max-width: 768px) 68vw, 600px" : "(max-width: 1024px) 50vw, 600px"}
            className="object-contain"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ImageIcon className="size-16 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 p-4 sm:gap-6 sm:p-6">
        <div>
          <h1
            className={cn(
              "font-bold tracking-tight",
              compact ? "text-xl" : "text-3xl sm:text-4xl",
            )}
          >
            {product.name}
          </h1>
          <p className="mt-1">
            <PresentationPrice
              price={product.price}
              currency={currency}
              className={cn(
                "font-semibold",
                compact ? "text-md" : "text-xl",
              )}
            />
          </p>
        </div>

        {product.description && (
          <p className="text-sm text-muted-foreground sm:text-base">
            {product.description}
          </p>
        )}

        {(hasKcal || hasAllergens) && (
          <div className="space-y-3">
            {hasKcal && (
              <div className="flex items-start gap-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-200">
                  <Flame className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs">Energia</p>
                  <p className="text-sm font-medium">{product.kcal} kcal</p>
                </div>
              </div>
            )}
            {hasAllergens && (
              <div className="flex items-start gap-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-200">
                  <Wheat className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs">Alergény</p>
                  <p className="text-sm font-medium">
                    {allergenLabels.join(", ")}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {product.ingredients.length > 0 && (
          <section className="mt-10 pb-10">
            <h2 className="mb-8 text-lg font-semibold tracking-tight sm:text-xl">
              Ingrediencie
            </h2>
            <IngredientCompositionStrip ingredients={product.ingredients} />
          </section>
        )}
      </div>
    </div>
  );
}
