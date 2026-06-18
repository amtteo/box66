import Image from "next/image";
import { ImageIcon } from "lucide-react";

import type { PresentationIngredient } from "@/lib/menu/presentation";

/** Zloženie produktu — obrázok ingrediencie a názov v mriežke. */
export function IngredientCompositionStrip({
  ingredients,
}: {
  ingredients: PresentationIngredient[];
}) {
  if (ingredients.length === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4">
      {ingredients.map((ingredient) => (
        <div
          key={ingredient.name}
          className="mb-6 flex flex-col items-center gap-2"
        >
          <div className="relative aspect-square w-full max-w-24 overflow-hidden">
            {ingredient.imageUrl ? (
              <Image
                src={ingredient.imageUrl}
                alt={ingredient.name}
                fill
                sizes="(max-width: 640px) 33vw, 120px"
                className="object-contain"
              />
            ) : (
              <div className="flex size-full items-center justify-center">
                <ImageIcon className="size-6 text-muted-foreground" />
              </div>
            )}
          </div>
          <span className="text-center text-xs font-medium leading-tight">
            {ingredient.name}
          </span>
        </div>
      ))}
    </div>
  );
}
