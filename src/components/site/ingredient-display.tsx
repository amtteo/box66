import Image from "next/image";
import { ImageIcon } from "lucide-react";

import type { PresentationIngredient } from "@/lib/menu/presentation";

/**
 * Pás zloženia pod produktom — štýl McDonald's: obrázok ingrediencie,
 * pod ním názov. Celý blok je pod hlavným layoutom (obrázok vľavo / info vpravo).
 */
export function IngredientCompositionStrip({
  ingredients,
}: {
  ingredients: PresentationIngredient[];
}) {
  if (ingredients.length === 0) return null;

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 sm:gap-6">
      {ingredients.map((ingredient) => (
        <div
          key={ingredient.name}
          className="flex w-24 shrink-0 flex-col items-center gap-2 sm:w-28"
        >
          <div className="relative size-20 overflow-hidden rounded-full border bg-muted sm:size-24">
            {ingredient.imageUrl ? (
              <Image
                src={ingredient.imageUrl}
                alt={ingredient.name}
                fill
                sizes="96px"
                className="object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center">
                <ImageIcon className="size-6 text-muted-foreground sm:size-8" />
              </div>
            )}
          </div>
          <span className="text-center text-xs font-medium leading-tight sm:text-sm">
            {ingredient.name}
          </span>
        </div>
      ))}
    </div>
  );
}
