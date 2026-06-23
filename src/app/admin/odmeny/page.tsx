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
    productId: r.product.id,
    pointsCost: r.pointsCost,
    sortOrder: r.sortOrder,
    isActive: r.isActive,
    productName: r.product.name,
    categoryName: r.product.category.name,
    imageUrl: r.product.imageUrl,
    productActive: r.product.isActive,
    choiceGroups: r.product.choiceGroups.map((g) => ({
      label: g.label,
      poolName: g.category.name,
    })),
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
      .filter((r) => !products.some((p) => p.id === r.product.id))
      .map((r) => ({
        id: r.product.id,
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
            Vernostný program — produkty z katalógu vymeniteľné za body. Veľkosť
            (S/M/L) sa nenastavuje na kategórii ani v Odmenách — prepojíš ju na
            konkrétnom produkte v Katalóg → Produkty → Receptúra → Výber pri
            objednávke.
          </p>
        </div>
        <RewardDialog products={products} />
      </div>
      <RewardsTable rewards={items} products={productsForDialogs} />
    </>
  );
}
