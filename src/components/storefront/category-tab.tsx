"use client";

import Image from "next/image";
import { ImageIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type CategoryTabData = {
  id: string;
  name: string;
  imageUrl: string | null;
};

export function CategoryTab({
  category,
  isActive,
  onClick,
  layout,
}: {
  category: CategoryTabData;
  isActive: boolean;
  onClick: () => void;
  layout: "mobile" | "desktop";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex shrink-0 flex-col items-center gap-2 transition-colors",
        layout === "mobile" ? "w-[76px] px-1 py-2" : "w-full px-3 py-3.5",
        isActive ? "border-2 border-primary" : "border-2 border-transparent",
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden",
          layout === "mobile" ? "size-14" : "size-20",
          isActive && "ring-primary/30",
        )}
      >
        {category.imageUrl ? (
          <Image
            src={category.imageUrl}
            alt=""
            fill
            sizes={layout === "mobile" ? "56px" : "80px"}
            className="object-contain"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ImageIcon
              className={cn(
                "text-muted-foreground",
                layout === "mobile" ? "size-7" : "size-9",
              )}
            />
          </div>
        )}
      </div>
      <span
        className={cn(
          "line-clamp-2 text-center leading-tight",
          layout === "mobile" ? "text-xs" : "text-sm",
          isActive ? "font-semibold text-foreground" : "text-muted-foreground",
        )}
      >
        {category.name}
      </span>
    </button>
  );
}
