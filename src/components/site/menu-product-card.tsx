import Link from "next/link";
import Image from "next/image";
import { ImageIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  formatPresentationPrice,
  type PresentationItem,
} from "@/lib/menu/presentation";

export function MenuProductCard({
  item,
  currency,
}: {
  item: PresentationItem;
  currency: string;
}) {
  return (
    <Link
      href={`/menu/${item.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ImageIcon className="size-10 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium leading-tight group-hover:underline">
            {item.name}
          </h3>
          <span className="shrink-0 font-semibold tabular-nums">
            {formatPresentationPrice(item.price, currency)}
          </span>
        </div>
        {item.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {item.description}
          </p>
        )}
        {item.kcal != null && (
          <Badge variant="secondary" className="mt-auto w-fit font-normal">
            {item.kcal} kcal
          </Badge>
        )}
      </div>
    </Link>
  );
}
