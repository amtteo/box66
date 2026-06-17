/** Spoločný stav formulárov pre `useActionState` / Server Actions. */
export type FormState =
  | {
      ok?: boolean;
      errors?: Record<string, string[]>;
      message?: string;
      values?: Record<string, string>;
    }
  | undefined;

/** Vráti orezaný reťazec alebo `undefined` pre prázdne hodnoty. */
export function strOrUndefined(
  v: FormDataEntryValue | null,
): string | undefined {
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? undefined : s;
}

/** Zozbiera textové polia formulára na opätovné vyplnenie po chybe. */
export function rawValues(
  formData: FormData,
  skip: string[] = [],
): Record<string, string> {
  const out: Record<string, string> = {};
  const skipSet = new Set(["image", ...skip]);
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && !skipSet.has(key)) out[key] = value;
  }
  return out;
}

/** Je to chyba unikátneho indexu (Postgres / Prisma P2002)? */
export function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "P2002"
  );
}

/** Zod chyby do plochej mapy `pole -> [správy]`. */
export function flattenZodError(error: {
  issues: { path: PropertyKey[]; message: string }[];
}): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    (out[key] ??= []).push(issue.message);
  }
  return out;
}
