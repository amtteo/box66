import type { MenuChoiceGroupDTO } from "@/lib/orders/types";

/** Odmena pre storefront (fáza 2+). */
export type LoyaltyRewardDTO = {
  id: string;
  productId: string;
  menuItemId: string;
  name: string;
  imageUrl: string | null;
  pointsCost: number;
  /** Skupiny výberu s dostupnými možnosťami v predajni (napr. veľkosť). */
  choiceGroups: MenuChoiceGroupDTO[];
  /** Produkt má v katalógu povinný výber variantu (napr. veľkosť). */
  requiresVariantChoice: boolean;
  /** Všetky povinné skupiny majú v predajni aspoň jednu možnosť. */
  variantChoiceReady: boolean;
};

export type LoyaltyBalanceDTO = {
  balance: number;
  /** Zostatok po odpočítaní bodov držaných v košíku (virtuálny hold). */
  available: number;
};
