/** Klientsky bezpečné typy a pomocníci pre objednávanie (bez server-only). */

/** Jedna možnosť výberu v kombe (konkrétny produkt dostupný v danej predajni). */
export type MenuChoiceOptionDTO = {
  menuItemId: string;
  productId: string;
  name: string;
  imageUrl: string | null;
};

/** Skupina výberu na kombo produkte (napr. „Vyber nápoj"). */
export type MenuChoiceGroupDTO = {
  id: string;
  label: string;
  minSelect: number;
  maxSelect: number;
  options: MenuChoiceOptionDTO[];
};

/** MENU upsell — dostupná MENU verzia pri objednávaní single produktu. */
export type MenuUpsellDTO = {
  id: string;
  name: string;
  imageUrl: string | null;
  price: number;
  choiceGroups: MenuChoiceGroupDTO[];
};

export type MenuItemDTO = {
  /** ID položky menu (MenuItem) — používa sa pri objednávke. */
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  allergens: string[];
  kcal: number | null;
  prepMinutes: number | null;
  price: number;
  categoryId: string;
  categoryName: string;
  /** Skupiny výberu (kombo) — ak má aspoň jednu, pred pridaním sa zobrazí výber. */
  choiceGroups: MenuChoiceGroupDTO[];
  /** Ponuka MENU verzie pri pridaní single produktu (burger → menu s nápojom). */
  menuUpsell: MenuUpsellDTO | null;
};

export type MenuCategoryDTO = {
  id: string;
  name: string;
  imageUrl: string | null;
  items: MenuItemDTO[];
};

/** Vybraná voľba v košíku/objednávke (snímka pre zobrazenie + odkaz na produkt). */
export type CartChoice = {
  groupId: string;
  groupLabel: string;
  menuItemId: string;
  productId: string;
  name: string;
};

export type CartLine = {
  /** Unikátny identifikátor riadka (rovnaký produkt s iným výberom = iný riadok). */
  lineId: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
  choices: CartChoice[];
  /** Vernostná odmena — cena 0 €, body sa držia virtuálne v košíku. */
  isLoyaltyReward?: boolean;
  loyaltyRewardId?: string;
  pointsCost?: number;
};

/** Naformátuje sumu v mene predajne (sk-SK). */
export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("sk-SK", {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}
