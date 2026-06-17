"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/auth/dal";
import { getActiveContext } from "@/lib/auth/active-context";
import { authorizeOrg } from "@/lib/auth/tenancy";
import { MembershipStatus } from "@/generated/prisma/enums";
import { hasAtLeast } from "@/lib/rbac";
import { syncUserClaims } from "@/lib/auth/claims";
import {
  flattenZodError,
  isUniqueViolation,
  rawValues,
  type FormState,
} from "@/lib/forms";
import { InviteMemberSchema, UpdateMemberSchema } from "@/lib/team/schemas";

const PATH = "/admin/tim";

/** Pozve / priradí používateľa do predajne s rolou MANAGER alebo STAFF. */
export async function inviteMember(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await getActiveContext();
  if (!ctx.organizationId) return { ok: false, message: "Nemáš aktívnu organizáciu." };
  await authorizeOrg(ctx.organizationId, Role.ADMIN);

  const parsed = InviteMemberSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
    storeId: formData.get("storeId"),
  });
  if (!parsed.success) {
    return { ok: false, errors: flattenZodError(parsed.error), values: rawValues(formData) };
  }

  const { email, role, storeId } = parsed.data;

  // Predajňa musí patriť do aktívnej organizácie.
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { organizationId: true },
  });
  if (!store || store.organizationId !== ctx.organizationId) {
    return { ok: false, errors: { storeId: ["Neplatná predajňa."] }, values: rawValues(formData) };
  }

  const profile = await prisma.profile.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true },
  });
  if (!profile) {
    return {
      ok: false,
      errors: { email: ["Používateľ s týmto e-mailom sa ešte nezaregistroval."] },
      values: rawValues(formData),
    };
  }

  try {
    const existing = await prisma.membership.findFirst({
      where: { profileId: profile.id, organizationId: ctx.organizationId, storeId },
      select: { id: true },
    });
    if (existing) {
      await prisma.membership.update({
        where: { id: existing.id },
        data: { role, status: MembershipStatus.ACTIVE },
      });
    } else {
      await prisma.membership.create({
        data: {
          profileId: profile.id,
          organizationId: ctx.organizationId,
          storeId,
          role,
          status: MembershipStatus.ACTIVE,
        },
      });
    }
    await syncUserClaims(profile.id);
  } catch (err) {
    if (isUniqueViolation(err)) {
      return { ok: false, message: "Tento používateľ už má v predajni rolu." };
    }
    return { ok: false, message: "Priradenie sa nepodarilo. Skús to znova." };
  }

  revalidatePath(PATH);
  return { ok: true };
}

export async function updateMember(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await getActiveContext();
  if (!ctx.organizationId) return { ok: false, message: "Nemáš aktívnu organizáciu." };
  await authorizeOrg(ctx.organizationId, Role.ADMIN);

  const parsed = UpdateMemberSchema.safeParse({
    membershipId: formData.get("membershipId"),
    role: formData.get("role"),
    storeId: formData.get("storeId"),
  });
  if (!parsed.success) {
    return { ok: false, errors: flattenZodError(parsed.error), values: rawValues(formData) };
  }

  const { membershipId, role, storeId } = parsed.data;

  const membership = await prisma.membership.findUnique({
    where: { id: membershipId },
    select: { organizationId: true, role: true, profileId: true },
  });
  if (!membership || membership.organizationId !== ctx.organizationId) {
    return { ok: false, message: "Členstvo neexistuje." };
  }
  if (hasAtLeast(membership.role as Role, Role.ADMIN)) {
    return { ok: false, message: "Administrátorov spravuje superadmin." };
  }

  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { organizationId: true },
  });
  if (!store || store.organizationId !== ctx.organizationId) {
    return { ok: false, errors: { storeId: ["Neplatná predajňa."] } };
  }

  try {
    await prisma.membership.update({
      where: { id: membershipId },
      data: { role, storeId },
    });
    await syncUserClaims(membership.profileId);
  } catch (err) {
    if (isUniqueViolation(err)) {
      return { ok: false, message: "Používateľ už má v tejto predajni rolu." };
    }
    return { ok: false, message: "Úpravu sa nepodarilo uložiť." };
  }

  revalidatePath(PATH);
  return { ok: true };
}

export async function removeMember(membershipId: string): Promise<FormState> {
  const ctx = await getActiveContext();
  if (!ctx.organizationId) return { ok: false, message: "Nemáš aktívnu organizáciu." };
  await authorizeOrg(ctx.organizationId, Role.ADMIN);

  const membership = await prisma.membership.findUnique({
    where: { id: membershipId },
    select: { organizationId: true, role: true, profileId: true },
  });
  if (!membership || membership.organizationId !== ctx.organizationId) {
    return { ok: false, message: "Členstvo neexistuje." };
  }
  if (hasAtLeast(membership.role as Role, Role.ADMIN)) {
    return { ok: false, message: "Administrátorov spravuje superadmin." };
  }

  try {
    await prisma.membership.delete({ where: { id: membershipId } });
    await syncUserClaims(membership.profileId);
  } catch {
    return { ok: false, message: "Člena sa nepodarilo odobrať." };
  }

  revalidatePath(PATH);
  return { ok: true };
}
