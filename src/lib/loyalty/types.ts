/** Odmena pre storefront (fáza 2+). */
export type LoyaltyRewardDTO = {
  id: string;
  productId: string;
  menuItemId: string;
  name: string;
  imageUrl: string | null;
  pointsCost: number;
};

export type LoyaltyBalanceDTO = {
  balance: number;
  /** Zostatok po odpočítaní bodov držaných v košíku (virtuálny hold). */
  available: number;
};
