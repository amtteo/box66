import type { Metadata } from "next";

import { requireRole, Role } from "@/lib/auth/dal";
import {
  getLoyaltyRewardProductOptions,
  getLoyaltyRewards,
} from "@/lib/loyalty/queries";
import { RewardDialog } from "@/components/admin/loyalty/reward-dialog";
import {
  RewardsTable,
  type RewardListItem,
} from "@/components/admin/loyalty/rewards-table";

export const metadata: Metadata = { title: "Odmeny" };

export default async function OdmenyPage() {
  await requireRole(Role.SUPERADMIN);

  const [rewards, productOptions] = await Promise.all([
    getLoyaltyRewards(),
    getLoyaltyRewardProductOptions(),
  ]);

  const items: RewardListItem[] = rewards.map((r) => ({
    id: r.id,
    productId: r.productId,
    pointsCost: r.pointsCost,
    sortOrder: r.sortOrder,
    isActive: r.isActive,
    productName: r.product.name,
    categoryName: r.product.category.name,
    imageUrl: r.product.imageUrl,
    productActive: r.product.isActive,
  }));

  const products = productOptions.map((p) => ({
    id: p.id,
    name: p.name,
    categoryName: p.category.name,
  }));

  // Pri editácii musí byť aktuálny produkt v zozname.
  const productsForDialogs = [
    ...products,
    ...rewards
      .filter((r) => !products.some((p) => p.id === r.productId))
      .map((r) => ({
        id: r.productId,
        name: r.product.name,
        categoryName: r.product.category.name,
      })),
  ];

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Odmeny</h1>
          <p className="text-sm text-muted-foreground">
            Vernostný program — produkty z katalógu vymeniteľné za body. Zobrazených
            je max. 9 odmen v košíku (zoradené podľa poradia).
          </p>
        </div>
        <RewardDialog products={products} />
      </div>
      <RewardsTable rewards={items} products={productsForDialogs} />
    </>
  );
}
