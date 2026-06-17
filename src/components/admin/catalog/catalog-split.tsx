import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function CatalogSplit({
  children,
  panel,
  className,
}: {
  children: ReactNode;
  panel?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-6 lg:grid-cols-12", className)}>
      <div className="min-w-0 lg:col-span-5">{children}</div>
      <div className="min-w-0 lg:col-span-7 lg:sticky lg:top-6 lg:self-start">
        {panel ?? (
          <div className="flex h-full min-h-48 items-center justify-center rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Vyber položku v zozname alebo vytvor novú.
          </div>
        )}
      </div>
    </div>
  );
}
