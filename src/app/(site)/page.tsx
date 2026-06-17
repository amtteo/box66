import { getProfile, getUser } from "@/lib/auth/dal";
import { getDefaultStore, getPublicMenu } from "@/lib/orders/queries";
import { isStripeConfigured } from "@/lib/stripe/server";
import { CartProvider } from "@/components/storefront/cart-context";
import { MenuBoard } from "@/components/storefront/menu-board";
import { CartSheet } from "@/components/storefront/cart-sheet";
import type { MenuCategoryDTO } from "@/lib/orders/types";

export default async function Home() {
  const [user, store] = await Promise.all([getUser(), getDefaultStore()]);

  if (!store) {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 py-24 text-center text-muted-foreground">
        <h1 className="mb-2 text-3xl font-semibold text-foreground">Box66</h1>
        <p>Momentálne nie je dostupná žiadna predajňa.</p>
      </div>
    );
  }

  return (
    <StoreFront storeId={store.id} currency={store.currency} isAuthed={!!user} />
  );
}

async function StoreFront({
  storeId,
  currency,
  isAuthed,
}: {
  storeId: string;
  currency: string;
  isAuthed: boolean;
}) {
  const [menu, profile] = await Promise.all([
    getPublicMenu(storeId),
    getProfile(),
  ]);

  const map = new Map<string, MenuCategoryDTO>();
  for (const mi of menu) {
    const cat = mi.product.category;
    if (!map.has(cat.id)) {
      map.set(cat.id, {
        id: cat.id,
        name: cat.name,
        imageUrl: cat.imageUrl,
        items: [],
      });
    }
    map.get(cat.id)!.items.push({
      id: mi.id,
      name: mi.product.name,
      description: mi.product.description,
      imageUrl: mi.product.imageUrl,
      allergens: mi.product.allergens,
      kcal: mi.product.kcal,
      prepMinutes: mi.product.prepMinutes,
      price: mi.price,
      categoryId: cat.id,
      categoryName: cat.name,
      choiceGroups: mi.choiceGroups,
    });
  }
  const categories = [...map.values()];

  const onlinePaymentEnabled =
    isStripeConfigured() && !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  const defaultCustomer = profile
    ? { name: profile.fullName ?? undefined, email: profile.email }
    : undefined;

  return (
    <CartProvider storeId={storeId}>
      <MenuBoard
        categories={categories}
        currency={currency}
        showWelcome={!isAuthed}
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
