"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MapPin, X } from "lucide-react";

import { importPlacesLibrary } from "@/lib/google-maps/loader";
import { cn } from "@/lib/utils";

import "./delivery-address-input.css";

function applyWidgetStyles(
  widget: google.maps.places.PlaceAutocompleteElement,
): void {
  widget.style.width = "100%";
  widget.style.minHeight = "3rem";
  widget.style.colorScheme = "light";
  widget.style.backgroundColor = "transparent";
  widget.style.border = "none";
  widget.style.borderRadius = "0";
  widget.style.boxShadow = "none";
  widget.style.outline = "none";
}

function readLatLng(
  location: google.maps.LatLng | google.maps.LatLngLiteral,
): { lat: number; lng: number } {
  if (typeof (location as google.maps.LatLng).lat === "function") {
    const ll = location as google.maps.LatLng;
    return { lat: ll.lat(), lng: ll.lng() };
  }
  const literal = location as google.maps.LatLngLiteral;
  return { lat: literal.lat, lng: literal.lng };
}

type Props = {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  onPlaceSelect: (place: { address: string; lat: number; lng: number }) => void;
  disabled?: boolean;
  className?: string;
  /** Zobrazí krížik aj keď je len vypočítaná donáška bez textu v poli. */
  showClear?: boolean;
};

export function DeliveryAddressInput({
  value,
  onChange,
  onClear,
  onPlaceSelect,
  disabled,
  className,
  showClear: showClearProp,
}: Props) {
  const widgetHostRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<google.maps.places.PlaceAutocompleteElement | null>(
    null,
  );
  const valueRef = useRef(value);
  valueRef.current = value;
  const [widgetReady, setWidgetReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void importPlacesLibrary()
      .then(({ PlaceAutocompleteElement }) => {
        if (cancelled || !widgetHostRef.current) return;

        const widget = new PlaceAutocompleteElement({
          includedRegionCodes: ["sk"],
          placeholder: "Zadaj adresu doručenia",
          noClearButton: true,
          noInputIcon: true,
        });

        widget.className = "w-full";
        applyWidgetStyles(widget);
        widgetRef.current = widget;
        widgetHostRef.current.replaceChildren(widget);

        const onSelect = async (event: Event) => {
          const { placePrediction } =
            event as google.maps.places.PlacePredictionSelectEvent;
          const place = placePrediction.toPlace();
          await place.fetchFields({
            fields: ["formattedAddress", "location"],
          });

          const address = place.formattedAddress?.trim();
          const location = place.location;
          if (!address || !location) return;

          const { lat, lng } = readLatLng(location);
          widget.value = address;
          onChange(address);
          onPlaceSelect({ address, lat, lng });
        };

        const onInput = () => {
          onChange(widget.value);
        };

        widget.addEventListener("gmp-select", (ev) => {
          void onSelect(ev);
        });
        widget.addEventListener("input", onInput);

        widget.value = valueRef.current;
        setWidgetReady(true);
      })
      .catch(() => {
        /* API kľúč alebo Places API (New) doplní prevádzkovateľ */
      });

    return () => {
      cancelled = true;
      widgetRef.current = null;
      setWidgetReady(false);
      widgetHostRef.current?.replaceChildren();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- widget sa inicializuje raz
  }, []);

  useEffect(() => {
    const widget = widgetRef.current;
    if (!widget || !widgetReady) return;
    widget.disabled = !!disabled;
    if (value !== widget.value) {
      widget.value = value;
    }
  }, [disabled, value, widgetReady]);

  const handleClear = useCallback(() => {
    const widget = widgetRef.current;
    if (widget) widget.value = "";
    onClear();
  }, [onClear]);

  const showClear =
    !disabled &&
    (showClearProp ?? value.trim().length > 0);

  return (
    <div className={cn("relative w-full", className)}>
      <div
        className={cn(
          "delivery-field delivery-address-autocomplete delivery-address-autocomplete--with-icon",
          showClear && "delivery-address-autocomplete--has-clear",
          disabled && "delivery-field--disabled",
        )}
      >
        <MapPin className="delivery-field__icon" aria-hidden />
        <div ref={widgetHostRef} className="delivery-address-autocomplete__widget" />
        {showClear && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Vymazať adresu a donášku"
            className="delivery-field__trailing delivery-field__trailing--action flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
