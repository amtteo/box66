"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { CartChoice, CartLine, MenuItemDTO } from "@/lib/orders/types";

/** Deterministický identifikátor riadka = položka menu + zvolené voľby. */
function computeLineId(menuItemId: string, choices: CartChoice[]): string {
  const sig = [...choices]
    .map((c) => `${c.groupId}:${c.menuItemId}`)
    .sort()
    .join(",");
  return sig ? `${menuItemId}#${sig}` : menuItemId;
}

function readStoredCart(storageKey: string): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<CartLine>[];
    // Normalizácia (staršie košíky bez lineId/choices).
    return parsed
      .filter((l) => typeof l.menuItemId === "string")
      .map((l) => {
        const choices = Array.isArray(l.choices) ? (l.choices as CartChoice[]) : [];
        return {
          lineId: l.lineId ?? computeLineId(l.menuItemId as string, choices),
          menuItemId: l.menuItemId as string,
          name: l.name ?? "",
          price: typeof l.price === "number" ? l.price : 0,
          quantity: typeof l.quantity === "number" ? l.quantity : 1,
          imageUrl: l.imageUrl ?? null,
          choices,
        };
      });
  } catch {
    return [];
  }
}

type CartContextValue = {
  lines: CartLine[];
  totalQuantity: number;
  subtotal: number;
  add: (item: MenuItemDTO, choices?: CartChoice[]) => void;
  setQuantity: (lineId: string, quantity: number) => void;
  remove: (lineId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({
  storeId,
  children,
}: {
  storeId: string;
  children: React.ReactNode;
}) {
  const storageKey = `box66_cart_${storeId}`;
  // Lazy init z localStorage (na serveri []); persistencia cez efekt nižšie.
  const [lines, setLines] = useState<CartLine[]>(() =>
    readStoredCart(storageKey),
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(lines));
    } catch {
      /* ignore */
    }
  }, [lines, storageKey]);

  const add = useCallback((item: MenuItemDTO, choices: CartChoice[] = []) => {
    const lineId = computeLineId(item.id, choices);
    setLines((prev) => {
      const existing = prev.find((l) => l.lineId === lineId);
      if (existing) {
        return prev.map((l) =>
          l.lineId === lineId
            ? { ...l, quantity: Math.min(l.quantity + 1, 99) }
            : l,
        );
      }
      return [
        ...prev,
        {
          lineId,
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
          imageUrl: item.imageUrl,
          choices,
        },
      ];
    });
  }, []);

  const setQuantity = useCallback((lineId: string, quantity: number) => {
    setLines((prev) => {
      if (quantity <= 0) return prev.filter((l) => l.lineId !== lineId);
      return prev.map((l) =>
        l.lineId === lineId
          ? { ...l, quantity: Math.min(quantity, 99) }
          : l,
      );
    });
  }, []);

  const remove = useCallback((lineId: string) => {
    setLines((prev) => prev.filter((l) => l.lineId !== lineId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(() => {
    const totalQuantity = lines.reduce((sum, l) => sum + l.quantity, 0);
    const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
    return { lines, totalQuantity, subtotal, add, setQuantity, remove, clear };
  }, [lines, add, setQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart musí byť použité vnútri <CartProvider>.");
  return ctx;
}
