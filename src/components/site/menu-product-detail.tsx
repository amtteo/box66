import Image from "next/image";
import { Flame, ImageIcon } from "lucide-react";

import { ALLERGENS } from "@/lib/catalog/schemas";
import { formatMoney } from "@/lib/orders/types";
import type { PresentationItem } from "@/lib/menu/presentation";
import { Badge } from "@/components/ui/badge";
import { IngredientCompositionStrip } from "@/components/site/ingredient-display";
import { cn } from "@/lib/utils";

const ALLERGEN_LABEL = new Map(ALLERGENS.map((a) => [a.code, a.label]));

export function MenuProductDetail({
  product,
  categoryName,
  currency,
  compact = false,
  className,
}: {
  product: PresentationItem;
  categoryName: string;
  currency: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col overflow-y-auto", className)}>
      <div className="relative aspect-[4/3] w-full">
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
          <Badge variant="secondary" className="mb-2">
            {categoryName}
          </Badge>
          <h1
            className={cn(
              "font-semibold tracking-tight",
              compact ? "text-xl" : "text-3xl sm:text-4xl",
            )}
          >
            {product.name}
          </h1>
          <p
            className={cn(
              "mt-1 font-semibold tabular-nums",
              compact ? "text-lg" : "text-2xl",
            )}
          >
            {formatMoney(product.price, currency)}
          </p>
        </div>

        {product.description && (
          <p className="text-sm text-muted-foreground sm:text-base">
            {product.description}
          </p>
        )}

        {product.kcal != null && (
          <div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
            <Flame className="size-4 text-muted-foreground" />
            <span className="font-medium tabular-nums">
              {product.kcal} kcal
            </span>
          </div>
        )}

        <p className="text-xs text-foreground sm:text-sm">
          <span className="font-semibold">Alergény:</span>{" "}
          {product.allergens.length > 0
            ? product.allergens
                .map((code) => ALLERGEN_LABEL.get(code) ?? code)
                .join(", ")
            : "bez deklarovaných alergénov"}
        </p>

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
