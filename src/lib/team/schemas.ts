import * as z from "zod";

import { Role } from "@/generated/prisma/enums";

/** Role priraditeľné na úrovni predajne cez správu tímu. */
export const ASSIGNABLE_ROLES = [Role.MANAGER, Role.STAFF] as const;

export const InviteMemberSchema = z.object({
  email: z.email({ error: "Zadaj platný e-mail používateľa." }),
  role: z.enum(ASSIGNABLE_ROLES, { error: "Vyber rolu." }),
  storeId: z.uuid({ error: "Vyber predajňu." }),
});

export const UpdateMemberSchema = z.object({
  membershipId: z.uuid(),
  role: z.enum(ASSIGNABLE_ROLES, { error: "Vyber rolu." }),
  storeId: z.uuid({ error: "Vyber predajňu." }),
});

export type InviteMemberInput = z.infer<typeof InviteMemberSchema>;
