/** Normalizuje telefón na +{číslice} — bez obmedzenia krajiny. */
export function normalizePhone(input: string | null | undefined): string | null {
  if (!input?.trim()) return null;
  const trimmed = input.trim();
  let digits = "";
  let hasPlus = false;
  for (const ch of trimmed) {
    if (ch === "+" && digits.length === 0 && !hasPlus) {
      hasPlus = true;
    } else if (ch >= "0" && ch <= "9") {
      digits += ch;
    }
  }
  if (!digits) return null;
  if (!hasPlus && trimmed.startsWith("00")) {
    return `+${digits.slice(2)}`;
  }
  return hasPlus || trimmed.startsWith("+") ? `+${digits}` : `+${digits}`;
}
