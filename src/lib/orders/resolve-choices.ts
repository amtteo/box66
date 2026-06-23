import "server-only";

export type ChoiceGroupInput = {
  id: string;
  label: string;
  categoryId: string;
  minSelect: number;
  maxSelect: number;
};

export type ClientChoiceInput = {
  groupId: string;
  menuItemId: string;
};

export type ResolvedOrderChoice = {
  groupId: string;
  groupLabel: string;
  productId: string;
  menuItemId: string;
  nameSnapshot: string;
};

type OptionInfo = { productId: string; name: string; categoryId: string };

/** Overí výber z pool kategórií a vráti snímky pre objednávku. */
export function resolveCartChoices(params: {
  productName: string;
  choiceGroups: ChoiceGroupInput[];
  clientChoices: ClientChoiceInput[];
  optionByMenuItemId: Map<string, OptionInfo>;
  optionIdsByCategory: Map<string, Set<string>>;
}): { ok: true; choices: ResolvedOrderChoice[] } | { ok: false; message: string } {
  const effectiveGroups = params.choiceGroups.filter(
    (g) => (params.optionIdsByCategory.get(g.categoryId)?.size ?? 0) > 0,
  );
  const groupById = new Map(effectiveGroups.map((g) => [g.id, g]));
  const choicesByGroup = new Map<string, ResolvedOrderChoice[]>();

  for (const ch of params.clientChoices) {
    const group = groupById.get(ch.groupId);
    if (!group) {
      return {
        ok: false,
        message: "Neplatný výber pri položke. Obnov stránku a skús to znova.",
      };
    }
    const validIds = params.optionIdsByCategory.get(group.categoryId);
    const opt = params.optionByMenuItemId.get(ch.menuItemId);
    if (!validIds?.has(ch.menuItemId) || !opt) {
      return {
        ok: false,
        message: "Zvolená možnosť už nie je dostupná. Obnov stránku.",
      };
    }
    const list = choicesByGroup.get(group.id) ?? [];
    list.push({
      groupId: group.id,
      groupLabel: group.label,
      productId: opt.productId,
      menuItemId: ch.menuItemId,
      nameSnapshot: opt.name,
    });
    choicesByGroup.set(group.id, list);
  }

  for (const group of effectiveGroups) {
    const count = choicesByGroup.get(group.id)?.length ?? 0;
    if (count < group.minSelect || count > group.maxSelect) {
      return {
        ok: false,
        message: `Pri „${params.productName}" treba dokončiť výber „${group.label}".`,
      };
    }
  }

  return { ok: true, choices: [...choicesByGroup.values()].flat() };
}
