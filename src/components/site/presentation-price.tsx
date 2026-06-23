import { formatMoney } from "@/lib/orders/types";
import { PRESENTATION_LOYALTY_LABEL } from "@/lib/menu/presentation-format";
import { cn } from "@/lib/utils";

export function PresentationPrice({
  price,
  currency,
  className,
}: {
  price: number | null;
  currency: string;
  className?: string;
}) {
  if (price == null) {
    return (
      <span className="text-[10px] font-normal leading-tight text-muted-foreground sm:text-xs">
        {PRESENTATION_LOYALTY_LABEL}
      </span>
    );
  }

  return (
    <span className={cn("tabular-nums", className)}>
      {formatMoney(price, currency)}
    </span>
  );
}
