/**
 * Prevod textu na URL-friendly slug. Odstráni diakritiku (vrátane slovenskej),
 * malé písmená, nealfanumerické znaky nahradí pomlčkami.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[ľĺ]/gi, "l")
    .replace(/[đ]/gi, "d")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

/**
 * Zabezpečí jedinečnosť slugu pomocou poskytnutej funkcie na overenie existencie.
 * Ak je `base` obsadený, pripája `-2`, `-3`, … kým nenájde voľný.
 */
export async function uniqueSlug(
  base: string,
  exists: (candidate: string) => Promise<boolean>,
): Promise<string> {
  const root = base || "polozka";
  let candidate = root;
  let suffix = 2;
  while (await exists(candidate)) {
    candidate = `${root}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}
