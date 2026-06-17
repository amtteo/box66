"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole, Role } from "@/lib/auth/dal";
import { MembershipStatus } from "@/generated/prisma/enums";
import { syncUserClaims } from "@/lib/auth/claims";
import { slugify, uniqueSlug } from "@/lib/catalog/slug";
import {
  flattenZodError,
  isUniqueViolation,
  rawValues,
  strOrUndefined,
  type FormState,
} from "@/lib/forms";
import { OrganizationSchema, AssignAdminSchema } from "@/lib/orgs/schemas";

const PATH = "/admin/organizacie";

export async function saveOrganization(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole(Role.SUPERADMIN);

  const id = strOrUndefined(formData.get("id"));
  const parsed = OrganizationSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    legalName: formData.get("legalName"),
    ico: formData.get("ico"),
    dic: formData.get("dic"),
    icDph: formData.get("icDph"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    city: formData.get("city"),
    postalCode: formData.get("postalCode"),
    country: formData.get("country"),
    isActive: formData.get("isActive"),
  });

  if (!parsed.success) {
    return { ok: false, errors: flattenZodError(parsed.error), values: rawValues(formData) };
  }

  const d = parsed.data;
  const slug = await uniqueSlug(d.slug ?? slugify(d.name), async (c) => {
    const found = await prisma.organization.findUnique({
      where: { slug: c },
      select: { id: true },
    });
    return !!found && found.id !== id;
  });

  try {
    const data = {
      name: d.name,
      slug,
      legalName: d.legalName ?? null,
      ico: d.ico ?? null,
      dic: d.dic ?? null,
      icDph: d.icDph ?? null,
      email: d.email ?? null,
      phone: d.phone ?? null,
      address: d.address ?? null,
      city: d.city ?? null,
      postalCode: d.postalCode ?? null,
      country: d.country ?? "SK",
      isActive: d.isActive,
    };
    if (id) {
      await prisma.organization.update({ where: { id }, data });
    } else {
      await prisma.organization.create({ data });
    }
  } catch {
    return {
      ok: false,
      message: "Organizáciu sa nepodarilo uložiť. Skús to znova.",
      values: rawValues(formData),
    };
  }

  revalidatePath(PATH);
  return { ok: true };
}

export async function deleteOrganization(id: string): Promise<FormState> {
  await requireRole(Role.SUPERADMIN);

  try {
    const org = await prisma.organization.findUnique({
      where: { id },
      select: { _count: { select: { stores: true } } },
    });
    if (!org) return { ok: false, message: "Organizácia neexistuje." };
    if (org._count.stores > 0) {
      return {
        ok: false,
        message: "Organizáciu nemožno zmazať — má vytvorené predajne.",
      };
    }
    // Členov (memberships) zmaže kaskáda; pred zmazaním si ich zapíšeme na sync claims.
    const members = await prisma.membership.findMany({
      where: { organizationId: id },
      select: { profileId: true },
    });
    await prisma.organization.delete({ where: { id } });
    await Promise.all(
      [...new Set(members.map((m) => m.profileId))].map((pid) =>
        syncUserClaims(pid).catch(() => undefined),
      ),
    );
  } catch {
    return { ok: false, message: "Organizáciu sa nepodarilo zmazať." };
  }

  revalidatePath(PATH);
  return { ok: true };
}

/** Priradí používateľa (podľa e-mailu) ako ADMINa organizácie. */
export async function assignOrgAdmin(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole(Role.SUPERADMIN);

  const parsed = AssignAdminSchema.safeParse({
    organizationId: formData.get("organizationId"),
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { ok: false, errors: flattenZodError(parsed.error), values: rawValues(formData) };
  }

  const { organizationId, email } = parsed.data;

  const profile = await prisma.profile.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true },
  });
  if (!profile) {
    return {
      ok: false,
      errors: {
        email: ["Používateľ s týmto e-mailom sa ešte nezaregistroval."],
      },
      values: rawValues(formData),
    };
  }

  try {
    const existing = await prisma.membership.findFirst({
      where: { profileId: profile.id, organizationId, storeId: null },
      select: { id: true },
    });
    if (existing) {
      await prisma.membership.update({
        where: { id: existing.id },
        data: { role: Role.ADMIN, status: MembershipStatus.ACTIVE },
      });
    } else {
      await prisma.membership.create({
        data: {
          profileId: profile.id,
          organizationId,
          storeId: null,
          role: Role.ADMIN,
          status: MembershipStatus.ACTIVE,
        },
      });
    }
    await syncUserClaims(profile.id);
  } catch (err) {
    if (isUniqueViolation(err)) {
      return { ok: false, message: "Tento používateľ už má v organizácii rolu." };
    }
    return { ok: false, message: "Priradenie sa nepodarilo. Skús to znova." };
  }

  revalidatePath(PATH);
  return { ok: true };
}

/** Odoberie ADMINa z organizácie (zmaže org-úroveň členstvo). */
export async function removeOrgAdmin(membershipId: string): Promise<FormState> {
  await requireRole(Role.SUPERADMIN);

  try {
    const membership = await prisma.membership.findUnique({
      where: { id: membershipId },
      select: { profileId: true },
    });
    if (!membership) return { ok: false, message: "Členstvo neexistuje." };
    await prisma.membership.delete({ where: { id: membershipId } });
    await syncUserClaims(membership.profileId);
  } catch {
    return { ok: false, message: "Odobratie sa nepodarilo." };
  }

  revalidatePath(PATH);
  return { ok: true };
}
