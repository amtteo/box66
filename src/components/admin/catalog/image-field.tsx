"use client";

import { useRef, useState, useEffect, type ChangeEvent, type ReactNode } from "react";
import { ArrowUpFromLine, ImageIcon, X } from "lucide-react";

import { cn } from "@/lib/utils";

const ACCEPT = "image/png,image/jpeg,image/webp,image/avif,image/gif";

type ImageFieldProps = {
  currentUrl?: string | null;
  variant?: "compact" | "large";
  className?: string;
};

/**
 * Pole na výber obrázka pre Server Action formulár. Posiela `image` (súbor),
 * `currentImageUrl` (existujúci) a `removeImage=on` pri odstránení.
 */
export function ImageField({
  currentUrl,
  variant = "large",
  className,
}: ImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);

  const shownUrl = preview ?? (removed ? null : (currentUrl ?? null));

  useEffect(() => {
    setPreview(null);
    setRemoved(false);
    if (inputRef.current) inputRef.current.value = "";
  }, [currentUrl]);

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setPreview(file ? URL.createObjectURL(file) : null);
    if (file) setRemoved(false);
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation();
    setPreview(null);
    setRemoved(true);
    if (inputRef.current) inputRef.current.value = "";
  }

  function openPicker() {
    inputRef.current?.click();
  }

  if (variant === "compact") {
    return (
      <CompactImageField
        className={className}
        currentUrl={currentUrl}
        shownUrl={shownUrl}
        inputRef={inputRef}
        onChange={onChange}
        onClear={clear}
        onOpen={openPicker}
        removed={removed}
      />
    );
  }

  return (
    <div className={cn("relative", className)}>
      <input type="hidden" name="currentImageUrl" value={currentUrl ?? ""} />
      {removed && <input type="hidden" name="removeImage" value="on" />}

      <input
        ref={inputRef}
        name="image"
        type="file"
        accept={ACCEPT}
        onChange={onChange}
        className="sr-only"
        tabIndex={-1}
      />

      <button
        type="button"
        onClick={openPicker}
        className={cn(
          "group relative flex w-full overflow-hidden rounded-xl border bg-muted/40 transition-colors",
          "aspect-square hover:border-primary/40 hover:bg-muted/60",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          !shownUrl && "border-dashed",
        )}
        aria-label={shownUrl ? "Zmeniť obrázok" : "Nahrať obrázok"}
      >
        {shownUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shownUrl}
            alt="Náhľad obrázka"
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 p-4 text-muted-foreground">
            <ImageIcon className="size-10 opacity-40" />
            <span className="text-center text-xs">Klikni pre nahratie</span>
          </div>
        )}

        <span
          className={cn(
            "absolute right-2 bottom-2 flex size-8 items-center justify-center rounded-full",
            "bg-background/90 text-foreground shadow-sm ring-1 ring-border",
            "transition-transform group-hover:scale-105",
          )}
        >
          <ArrowUpFromLine className="size-4" />
        </span>

        {shownUrl ? (
          <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-sm font-medium text-white opacity-0 transition-opacity group-hover:bg-black/35 group-hover:opacity-100">
            Zmeniť obrázok
          </span>
        ) : null}
      </button>

      {shownUrl ? (
        <button
          type="button"
          onClick={clear}
          className={cn(
            "absolute top-2 left-2 flex size-7 items-center justify-center rounded-full",
            "bg-background/90 text-muted-foreground shadow-sm ring-1 ring-border",
            "hover:bg-destructive hover:text-destructive-foreground",
          )}
          aria-label="Odstrániť obrázok"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}

function CompactImageField({
  className,
  currentUrl,
  shownUrl,
  inputRef,
  onChange,
  onClear,
  onOpen,
  removed,
}: {
  className?: string;
  currentUrl?: string | null;
  shownUrl: string | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onClear: (e: React.MouseEvent) => void;
  onOpen: () => void;
  removed: boolean;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <input type="hidden" name="currentImageUrl" value={currentUrl ?? ""} />
      {removed && <input type="hidden" name="removeImage" value="on" />}
      <input
        ref={inputRef}
        name="image"
        type="file"
        accept={ACCEPT}
        onChange={onChange}
        className="sr-only"
        tabIndex={-1}
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpen}
          className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted hover:border-primary/40"
        >
          {shownUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shownUrl} alt="Náhľad" className="size-full object-cover" />
          ) : (
            <ImageIcon className="size-5 text-muted-foreground" />
          )}
          <span className="absolute right-0.5 bottom-0.5 flex size-5 items-center justify-center rounded-full bg-background shadow ring-1 ring-border">
            <ArrowUpFromLine className="size-2.5" />
          </span>
        </button>
        {shownUrl ? (
          <button
            type="button"
            onClick={onClear}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Odstrániť
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function CatalogIdentityFields({
  image,
  children,
}: {
  image: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:items-start">
      <div className="w-full">{image}</div>
      <div className="flex min-w-0 flex-col gap-4">{children}</div>
    </div>
  );
}
