"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { CartAddedToaster } from "@/components/storefront/cart-added-toast";
import {
  loyaltyPointsHeld,
  loyaltyRewardLineId,
} from "@/lib/loyalty/cart";
import type { LoyaltyRewardDTO } from "@/lib/loyalty/types";
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
    return parsed
      .filter((l) => typeof l.menuItemId === "string")
      .map((l) => {
        const choices = Array.isArray(l.choices) ? (l.choices as CartChoice[]) : [];
        const isLoyaltyReward = l.isLoyaltyReward === true;
        return {
          lineId:
            l.lineId ??
            (isLoyaltyReward && l.loyaltyRewardId
              ? loyaltyRewardLineId(l.loyaltyRewardId, choices)
              : computeLineId(l.menuItemId as string, choices)),
          menuItemId: l.menuItemId as string,
          name: l.name ?? "",
          price: isLoyaltyReward ? 0 : typeof l.price === "number" ? l.price : 0,
          quantity: typeof l.quantity === "number" ? l.quantity : 1,
          imageUrl: l.imageUrl ?? null,
          ...(isLoyaltyReward && {
            isLoyaltyReward: true,
            loyaltyRewardId: l.loyaltyRewardId,
            pointsCost: l.pointsCost,
          }),
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
  /** Body držané v košíku (odmeny ešte neuplatnené). */
  pointsHeld: number;
  add: (item: MenuItemDTO, choices?: CartChoice[]) => void;
  addReward: (reward: LoyaltyRewardDTO, choices?: CartChoice[]) => void;
  setQuantity: (lineId: string, quantity: number) => void;
  remove: (lineId: string) => void;
  clear: () => void;
  rewardQuantity: (rewardId: string) => number;
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

  const addReward = useCallback(
    (reward: LoyaltyRewardDTO, choices: CartChoice[] = []) => {
      const lineId = loyaltyRewardLineId(reward.id, choices);
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
            menuItemId: reward.menuItemId,
            name: reward.name,
            price: 0,
            quantity: 1,
            imageUrl: reward.imageUrl,
            choices,
            isLoyaltyReward: true,
            loyaltyRewardId: reward.id,
            pointsCost: reward.pointsCost,
          },
        ];
      });
    },
    [],
  );

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

  const rewardQuantity = useCallback(
    (rewardId: string) =>
      lines
        .filter((l) => l.isLoyaltyReward && l.loyaltyRewardId === rewardId)
        .reduce((sum, l) => sum + l.quantity, 0),
    [lines],
  );

  const value = useMemo<CartContextValue>(() => {
    const totalQuantity = lines.reduce((sum, l) => sum + l.quantity, 0);
    const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
    const pointsHeld = loyaltyPointsHeld(lines);
    return {
      lines,
      totalQuantity,
      subtotal,
      pointsHeld,
      add,
      addReward,
      setQuantity,
      remove,
      clear,
      rewardQuantity,
    };
  }, [lines, add, addReward, setQuantity, remove, clear, rewardQuantity]);

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartAddedToaster />
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart musí byť použité vnútri <CartProvider>.");
  return ctx;
}
