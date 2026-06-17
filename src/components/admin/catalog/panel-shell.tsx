"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCatalogPanel } from "@/components/admin/catalog/use-catalog-panel";

export function PanelShell({
  title,
  description,
  statusActive,
  headerAction,
  children,
}: {
  title: string;
  description?: string;
  statusActive?: boolean;
  headerAction?: ReactNode;
  children: ReactNode;
}) {
  const { closePanel } = useCatalogPanel();

  return (
    <div className="flex max-h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-lg border bg-card">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {statusActive !== undefined ? (
              <span
                className={`size-2 shrink-0 rounded-full ${
                  statusActive ? "bg-green-500" : "bg-muted-foreground/40"
                }`}
                title={statusActive ? "Aktívna" : "Neaktívna"}
              />
            ) : null}
            <h3 className="font-medium text-xl">{title}</h3>
          </div>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {headerAction ?? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={closePanel}
            title="Zavrieť"
          >
            <X className="size-4" />
            <span className="sr-only">Zavrieť</span>
          </Button>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
    </div>
  );
}
