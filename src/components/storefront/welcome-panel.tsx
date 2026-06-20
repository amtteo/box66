"use client";

import {
  ChevronDown,
  Clock,
  Loader2,
  Route,
  Store,
  Wallet,
} from "lucide-react";

import { DeliveryAddressInput } from "@/components/storefront/delivery-address-input";
import { DeliveryAddressHistoryDropdown } from "@/components/storefront/delivery-address-history-dropdown";
import { useStorefront } from "@/components/storefront/storefront-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getStoreStreetLine } from "@/lib/delivery/address";
import { formatMoney } from "@/lib/orders/types";
import { formatDeliveryDuration } from "@/lib/delivery/format";
import { cn } from "@/lib/utils";

function StorePickerDropdown() {
  const { stores, nearbyStores, storeId, setStoreId, delivery } =
    useStorefront();

  const storeReady = delivery.quoteAttempted;
  const storeOptions = nearbyStores.length > 0 ? nearbyStores : [];
  const currentStore =
    storeOptions.find((s) => s.id === storeId) ??
    stores.find((s) => s.id === storeId);
  const storeStreetLine = currentStore ? getStoreStreetLine(currentStore) : "";
  const showStoreAddress = storeReady && storeStreetLine.length > 0;

  const otherStores = storeOptions.filter((s) => s.id !== storeId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "relative flex w-full max-w-[min(100vw-2rem,20rem)] items-center sm:max-w-xs",
            "border-2 border-foreground bg-background text-sm text-foreground shadow-xs",
            "transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
            showStoreAddress ? "min-h-12 py-1.5" : "h-12",
          )}
        >
          <span
            className="pointer-events-none absolute left-3 top-1/2 z-10 flex -translate-y-1/2 flex-col items-center"
            aria-hidden
          >
            <span className="relative z-[11] -mb-1.5 border-2 border-foreground bg-background p-[0.5px] text-[9px] font-bold leading-none text-foreground">
              66
            </span>
            <Store className="size-[1.40rem] text-foreground" />
          </span>
          <span
            className={cn(
              "min-w-0 flex-1 overflow-hidden px-10 text-left ml-3",
              showStoreAddress
                ? "flex flex-col justify-center gap-0.5"
                : "text-muted-foreground",
            )}
          >
            {showStoreAddress ? (
              <>
                <span className="text-[0.65rem] leading-none text-muted-foreground">
                  Adresa predajcu
                </span>
                <span className="truncate text-sm font-medium leading-tight">
                  {storeStreetLine}
                </span>
              </>
            ) : (
              "Zadajte lokalitu"
            )}
          </span>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-foreground"
            aria-hidden
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[14rem] border-2 border-primary p-4">
        {!storeReady ? (
          <DropdownMenuLabel className="px-2 py-3 text-center text-sm font-normal leading-snug text-muted-foreground text-center px-6">
            Zadajte adresu doručenia pre výber najbližšej donášky.
          </DropdownMenuLabel>
        ) : storeOptions.length <= 1 || otherStores.length === 0 ? (
          <DropdownMenuLabel className="px-2 py-3 text-center text-sm font-normal leading-snug text-foreground">
            Žiadne ďalšie predajne vo vašej lokalite.
          </DropdownMenuLabel>
        ) : (
          <>
            <DropdownMenuLabel className="text-xs uppercase tracking-wide text-muted-foreground">
              Predajne vo vašej lokalite
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={storeId} onValueChange={setStoreId}>
              {storeOptions.map((store) => (
                <DropdownMenuRadioItem
                  key={store.id}
                  value={store.id}
                  className="cursor-pointer py-2.5 text-sm font-medium"
                >
                  <span className="truncate">
                    {getStoreStreetLine(store)}
                    {store.city ? ` · ${store.city}` : ""}
                  </span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DeliveryQuoteDisplay({
  currency,
  delivery,
}: {
  currency: string;
  delivery: ReturnType<typeof useStorefront>["delivery"];
}) {
  const showBlock =
    delivery.pending ||
    delivery.fee != null ||
    (delivery.quoteAttempted && delivery.error);

  if (!showBlock) {
    return (
      <div className="flex min-h-[140px] flex-col items-center justify-center px-4 py-10 text-center text-muted-foreground">
        <Route className="mb-3 size-10 opacity-40" />
        <p className="text-base sm:text-lg">
          Zadajte adresu pre časový odhad a cenu donášky.
        </p>
      </div>
    );
  }

  if (delivery.pending) {
    return (
      <div className="flex min-h-[140px] flex-col items-center justify-center gap-3 px-4 py-10">
        <Loader2 className="size-12 animate-spin text-primary" />
        <p className="text-lg font-medium text-foreground">
          Počítam cenu donášky…
        </p>
      </div>
    );
  }

  if (delivery.quoteAttempted && delivery.error) {
    return (
      <div className="flex min-h-[140px] flex-col items-center justify-center px-4 py-10 text-center">
        <p className="max-w-md text-lg font-medium text-destructive">
          {delivery.error}
        </p>
      </div>
    );
  }

  if (delivery.fee == null || delivery.distanceKm == null) return null;

  return (
    <div className="flex min-h-[140px] flex-col items-center justify-center px-4 py-8">
      <div className="grid w-full max-w-xl gap-3 grid-cols-3 sm:gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-yellow-400">
            <Route className="size-7" />
          </div>
          <span className="text-xl font-bold tabular-nums text-foreground">
            {delivery.distanceKm} km
          </span>
          <span className="text-sm">
            Vzdialenosť
          </span>
        </div>

        {delivery.durationMinutes != null && (
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-yellow-400">
              <Clock className="size-7" />
            </div>
            <span className="text-xl font-bold tabular-nums text-foreground">
              {delivery.durationMinutes >= 60
                ? formatDeliveryDuration(delivery.durationMinutes)
                : `${delivery.durationMinutes} min`}
            </span>
            <span className="text-sm">
              Čas donášky
            </span>
          </div>
        )}

        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-yellow-400">
            <Wallet className="size-7" />
          </div>
          <span className="text-xl font-bold tabular-nums text-foreground">
            {formatMoney(delivery.fee, currency)}
          </span>
          <span className="text-sm">
            Donáška
          </span>
        </div>
      </div>
    </div>
  );
}

export function WelcomePanel({ isAuthed = false }: { isAuthed?: boolean }) {
  const {
    currency,
    delivery,
    setDeliveryAddress,
    resetDelivery,
    onDeliveryPlaceSelected,
    pickDeliveryAddress,
    menuLoading,
  } = useStorefront();

  const canResetDelivery =
    delivery.address.trim().length > 0 ||
    delivery.quoteAttempted ||
    delivery.fee != null ||
    delivery.pending;

  return (
    <div className="relative flex-1 md:border-r-2 md:border-primary">
      <div className="absolute right-3 top-3 z-10 w-[min(100vw-2rem,20rem)] sm:right-4 sm:top-4 sm:w-auto">
        <StorePickerDropdown />
      </div>

      <img
        src="/delivery2.webp"
        alt="Box66"
        className="mx-auto h-auto w-[300px] pt-12"
      />
      <h2 className="p-4 py-8 text-center text-4xl font-bold">
        Zadajte adresu doručenia
      </h2>

      <div className="space-y-3 p-4 sm:p-6">
        <div className="mx-auto flex max-w-md flex-col">
          <div className="flex w-full items-stretch">
            <DeliveryAddressInput
              className="bg-white"
              value={delivery.address}
              onChange={setDeliveryAddress}
              onClear={resetDelivery}
              onPlaceSelect={onDeliveryPlaceSelected}
              disabled={menuLoading}
              showClear={canResetDelivery}
              attachedPicker
            />
            <DeliveryAddressHistoryDropdown
              isAuthed={isAuthed}
              onPick={pickDeliveryAddress}
              disabled={menuLoading}
            />
          </div>

          <div className="mt-8">
            <DeliveryQuoteDisplay currency={currency} delivery={delivery} />
          </div>
        </div>
      </div>
    </div>
  );
}
