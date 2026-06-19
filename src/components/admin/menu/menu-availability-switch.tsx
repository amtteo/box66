"use client";

import { toast } from "sonner";

import { toggleMenuItemAvailability } from "@/lib/menu/actions";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function MenuAvailabilitySwitch({
  menuItemId,
  isAvailable,
  onAvailabilityChange,
  compact = false,
}: {
  menuItemId: string;
  isAvailable: boolean;
  onAvailabilityChange: (available: boolean) => void;
  compact?: boolean;
}) {
  function onCheckedChange(checked: boolean) {
    const previous = isAvailable;
    onAvailabilityChange(checked);

    void (async () => {
      const formData = new FormData();
      formData.set("menuItemId", menuItemId);
      formData.set("isAvailable", String(checked));
      const result = await toggleMenuItemAvailability(undefined, formData);
      if (!result?.ok) {
        onAvailabilityChange(previous);
        toast.error(result?.message ?? "Dostupnosť sa nepodarilo uložiť.");
      }
    })();
  }

  return (
    <div className="flex items-center gap-2">
      <Switch
        id={`available-${menuItemId}`}
        checked={isAvailable}
        onCheckedChange={onCheckedChange}
      />
      <Label htmlFor={`available-${menuItemId}`} className="sr-only">
        {isAvailable ? "Dostupné" : "Nedostupné"}
      </Label>
      {!compact && (
        <span className="text-xs text-muted-foreground tabular-nums">
          {isAvailable ? "Dostupné" : "Nedostupné"}
        </span>
      )}
    </div>
  );
}
