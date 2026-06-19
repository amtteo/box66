"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/admin/form-feedback";
import {
  saveDeliveryZoneDefaults,
  saveStoreDeliveryZones,
} from "@/lib/delivery/actions";
import type { DeliveryZoneListItem } from "@/lib/delivery/queries";

type ZoneRow = {
  id?: string;
  minKm: string;
  maxKm: string;
  price: string;
  sortOrder: number;
};

function toRows(zones: DeliveryZoneListItem[]): ZoneRow[] {
  return zones.map((z) => ({
    id: z.id,
    minKm: String(z.minKm),
    maxKm: String(z.maxKm),
    price: String(z.price),
    sortOrder: z.sortOrder,
  }));
}

function emptyRow(sortOrder: number): ZoneRow {
  return { minKm: "", maxKm: "", price: "", sortOrder };
}

type Props = {
  initialZones: DeliveryZoneListItem[];
  description?: string;
} & (
  | { storeId: string; mode?: "store" }
  | { mode: "defaults" }
);

export function DeliveryZonesForm(props: Props) {
  const { initialZones, description } = props;
  const [rows, setRows] = useState<ZoneRow[]>(
    initialZones.length > 0 ? toRows(initialZones) : [emptyRow(0)],
  );
  const [message, setMessage] = useState<string>();
  const [pending, startTransition] = useTransition();

  function updateRow(index: number, patch: Partial<ZoneRow>) {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow(prev.length)]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(undefined);
    startTransition(async () => {
      const payload = rows.map((r, i) => ({
        id: r.id,
        minKm: r.minKm,
        maxKm: r.maxKm,
        price: r.price,
        sortOrder: i,
      }));
      const res =
        props.mode === "defaults"
          ? await saveDeliveryZoneDefaults(payload)
          : await saveStoreDeliveryZones(
              "storeId" in props ? props.storeId : "",
              payload,
            );
      if (res && !res.ok) setMessage(res.message ?? "Uloženie zlyhalo.");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      <FormMessage message={message} />

      <div className="space-y-3">
        <div className="hidden gap-3 text-xs font-medium text-muted-foreground sm:grid sm:grid-cols-[1fr_1fr_1fr_auto]">
          <span>Od (km)</span>
          <span>Do (km)</span>
          <span>Cena (€)</span>
          <span className="w-10" />
        </div>

        {rows.map((row, index) => (
          <div
            key={row.id ?? `zone-${index}`}
            className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end sm:border-0 sm:p-0"
          >
            <div className="space-y-1">
              <Label className="sm:sr-only">Od (km)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={row.minKm}
                onChange={(e) => updateRow(index, { minKm: e.target.value })}
                placeholder="0"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="sm:sr-only">Do (km)</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={row.maxKm}
                onChange={(e) => updateRow(index, { maxKm: e.target.value })}
                placeholder="6"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="sm:sr-only">Cena (€)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={row.price}
                onChange={(e) => updateRow(index, { price: e.target.value })}
                placeholder="1.99"
                required
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => removeRow(index)}
              disabled={rows.length <= 1}
            >
              <Trash2 className="size-4" />
              <span className="sr-only">Odstrániť zónu</span>
            </Button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" onClick={addRow}>
          <Plus className="size-4" />
          Pridať zónu
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Ukladám…" : "Uložiť zóny"}
        </Button>
      </div>
    </form>
  );
}
