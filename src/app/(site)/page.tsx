import { getProfile, getUser } from "@/lib/auth/dal";
import { getPublicStores } from "@/lib/delivery/queries";
import { getDefaultStore, getPublicMenu } from "@/lib/orders/queries";
import { buildMenuCategories } from "@/lib/orders/menu-dto";
import { isStripeConfigured } from "@/lib/stripe/server";
import { CartProvider } from "@/components/storefront/cart-context";
import { MenuBoard } from "@/components/storefront/menu-board";
import { CartSheet } from "@/components/storefront/cart-sheet";
import { StorefrontProvider } from "@/components/storefront/storefront-context";
import { StorefrontShell } from "@/components/storefront/storefront-shell";

export default async function Home() {
  const [user, stores, defaultStore] = await Promise.all([
    getUser(),
    getPublicStores(),
    getDefaultStore(),
  ]);

  if (!defaultStore || stores.length === 0) {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 py-24 text-center text-muted-foreground">
        <h1 className="mb-2 text-3xl font-semibold text-foreground">Box66</h1>
        <p>Momentálne nie je dostupná žiadna predajňa.</p>
      </div>
    );
  }

  const menu = await getPublicMenu(defaultStore.id);
  const categories = buildMenuCategories(menu);

  const onlinePaymentEnabled =
    isStripeConfigured() && !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  const profile = await getProfile();
  const defaultCustomer = profile
    ? { name: profile.fullName ?? undefined, email: profile.email }
    : undefined;

  return (
    <StorefrontProvider
      stores={stores}
      initialStoreId={defaultStore.id}
      initialCategories={categories}
      initialCurrency={defaultStore.currency}
    >
      <StorefrontShell
        isAuthed={!!user}
        onlinePaymentEnabled={onlinePaymentEnabled}
        defaultCustomer={defaultCustomer}
      />
    </StorefrontProvider>
  );
}
