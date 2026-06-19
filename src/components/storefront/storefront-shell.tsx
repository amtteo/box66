"use client";

import { CartProvider } from "@/components/storefront/cart-context";
import { MenuBoard } from "@/components/storefront/menu-board";
import { CartSheet } from "@/components/storefront/cart-sheet";
import { useStorefront } from "@/components/storefront/storefront-context";

export function StorefrontShell({
  isAuthed,
  onlinePaymentEnabled,
  defaultCustomer,
}: {
  isAuthed: boolean;
  onlinePaymentEnabled: boolean;
  defaultCustomer?: { name?: string; email?: string };
}) {
  const { storeId, currency, categories, menuLoading } = useStorefront();

  return (
    <CartProvider key={storeId} storeId={storeId}>
      <MenuBoard
        categories={categories}
        currency={currency}
        showWelcome={!isAuthed}
        loading={menuLoading}
      />
      <CartSheet
        storeId={storeId}
        currency={currency}
        onlinePaymentEnabled={onlinePaymentEnabled}
        defaultCustomer={defaultCustomer}
        isAuthed={isAuthed}
      />
    </CartProvider>
  );
}
