import { Role } from "@/generated/prisma/enums";

export { Role };

/** Číselná váha roly — vyššie číslo = viac oprávnení. Použité na porovnania. */
export const ROLE_RANK: Record<Role, number> = {
  [Role.SUPERADMIN]: 100,
  [Role.ADMIN]: 80,
  [Role.MANAGER]: 60,
  [Role.STAFF]: 40,
  [Role.CUSTOMER]: 10,
};

/** Slovenské popisky rolí pre UI. */
export const ROLE_LABEL: Record<Role, string> = {
  [Role.SUPERADMIN]: "Superadmin",
  [Role.ADMIN]: "Administrátor (franšízant)",
  [Role.MANAGER]: "Prevádzkar",
  [Role.STAFF]: "Obsluha",
  [Role.CUSTOMER]: "Zákazník",
};

/** Má rola `role` aspoň úroveň `required`? */
export function hasAtLeast(role: Role, required: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[required];
}
