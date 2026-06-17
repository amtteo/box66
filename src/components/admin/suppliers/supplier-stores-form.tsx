"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { assignSupplierStores } from "@/lib/suppliers/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export type StoreAssignOption = {
  id: string;
  label: string;
};

export function SupplierStoresForm({
  supplierId,
  stores,
  assignedIds,
}: {
  supplierId: string;
  stores: StoreAssignOption[];
  assignedIds: string[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(assignedIds));
  const [pending, startTransition] = useTransition();

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function onSave() {
    const formData = new FormData();
    formData.set("supplierId", supplierId);
    for (const id of selected) formData.append("storeIds", id);

    startTransition(async () => {
      const result = await assignSupplierStores(undefined, formData);
      if (result?.ok) toast.success("Priradenie predajní bolo uložené.");
      else toast.error(result?.message ?? "Uloženie sa nepodarilo.");
    });
  }

  if (stores.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Zatiaľ nie sú vytvorené žiadne predajne. Najprv franšízant založí predajňu.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2">
        {stores.map((store) => (
          <label
            key={store.id}
            className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
          >
            <Checkbox
              checked={selected.has(store.id)}
              onCheckedChange={() => toggle(store.id)}
            />
            {store.label}
          </label>
        ))}
      </div>
      <Button type="button" onClick={onSave} disabled={pending} size="sm">
        {pending ? "Ukladám…" : "Uložiť priradenie predajní"}
      </Button>
    </div>
  );
}
