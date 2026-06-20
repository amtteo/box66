"use client";

import { useCallback, useEffect, useState } from "react";
import { Bike, ChevronDown, History } from "lucide-react";

import { fetchDeliveryAddressHistory } from "@/lib/delivery/actions";
import {
  getDeliverySearchHistory,
  type DeliverySearchHistoryEntry,
} from "@/lib/delivery/search-history";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type Props = {
  isAuthed?: boolean;
  onPick: (
    address: string,
    coords?: { lat: number; lng: number },
  ) => void | Promise<void>;
  disabled?: boolean;
};

export function DeliveryAddressHistoryDropdown({
  isAuthed = false,
  onPick,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const [orderAddresses, setOrderAddresses] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<DeliverySearchHistoryEntry[]>(
    [],
  );
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(() => {
    setSearchHistory(getDeliverySearchHistory());

    if (!isAuthed) {
      setOrderAddresses([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    void fetchDeliveryAddressHistory()
      .then((res) => {
        if (res.ok) setOrderAddresses(res.orderAddresses);
        else setOrderAddresses([]);
      })
      .finally(() => setLoading(false));
  }, [isAuthed]);

  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  const hasOrders = orderAddresses.length > 0;
  const hasSearches = searchHistory.length > 0;
  const hasAny = hasOrders || hasSearches;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label="História adries doručenia"
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center",
            "border-2 border-foreground border-l-0 bg-background text-foreground shadow-xs",
            "transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
            disabled && "pointer-events-none opacity-50",
          )}
        >
          <ChevronDown className="size-5 text-foreground" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-[16rem] max-w-[min(100vw-2rem,22rem)] border-2 border-primary p-2"
      >
        {loading && !hasAny && (
          <DropdownMenuLabel className="px-3 py-4 text-center text-sm font-normal text-muted-foreground">
            Načítavam históriu…
          </DropdownMenuLabel>
        )}

        {!loading && !hasAny && (
          <DropdownMenuLabel className="px-3 py-4 text-center text-sm font-normal leading-snug text-muted-foreground">
            {isAuthed
              ? "Zatiaľ nemáš uložené adresy."
              : "Zatiaľ nemáš žiadne použité adresy v tomto prehliadači."}
          </DropdownMenuLabel>
        )}

        {isAuthed && hasOrders && (
          <>
            <DropdownMenuLabel className="text-xs uppercase tracking-wide text-muted-foreground">
              Doručené objednávky
            </DropdownMenuLabel>
            {orderAddresses.map((address) => (
              <DropdownMenuItem
                key={`order:${address}`}
                className="cursor-pointer gap-3 py-2.5"
                onSelect={() => {
                  void onPick(address);
                }}
              >
                <Bike className="size-4 shrink-0 text-primary" />
                <span className="line-clamp-2 text-sm leading-snug">{address}</span>
              </DropdownMenuItem>
            ))}
          </>
        )}

        {isAuthed && hasOrders && hasSearches && <DropdownMenuSeparator />}

        {hasSearches && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Použité adresy
            </DropdownMenuLabel>
            {searchHistory.map((entry) => (
              <DropdownMenuItem
                key={`search:${entry.address}`}
                className="cursor-pointer gap-3 py-2.5"
                onSelect={() => {
                  void onPick(entry.address, {
                    lat: entry.lat,
                    lng: entry.lng,
                  });
                }}
              >
                <History className="size-4 shrink-0 text-muted-foreground" />
                <span className="line-clamp-2 text-sm leading-snug">
                  {entry.address}
                </span>
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
