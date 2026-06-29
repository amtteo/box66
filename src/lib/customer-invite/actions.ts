"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { SignUpSchema, type AuthFormState } from "@/lib/auth/schemas";
import { mergePendingInviteForProfile } from "@/lib/customer-invite/merge";
import { getPendingInviteByToken } from "@/lib/customer-invite/queries";

export async function completeInviteSignUp(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const token = String(formData.get("token") ?? "");
  const invite = token ? await getPendingInviteByToken(token) : null;

  if (!invite) {
    return {
      ok: false,
      message: "Odkaz je neplatný alebo expiroval. Požiadajte personál o nový SMS odkaz.",
    };
  }

  const parsed = SignUpSchema.safeParse({
    fullName: formData.get("fullName") ?? invite.fullName ?? "",
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      errors: z_flatten(parsed.error),
      values: {
        fullName: String(formData.get("fullName") ?? invite.fullName ?? ""),
        email: String(formData.get("email") ?? ""),
      },
    };
  }

  const { fullName, email, password } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone: invite.phone,
      },
    },
  });

  if (error) {
    return {
      ok: false,
      message:
        error.code === "user_already_exists" || /already/i.test(error.message)
          ? "Účet s týmto e-mailom už existuje."
          : "Registráciu sa nepodarilo dokončiť. Skúste to znova.",
      values: { fullName, email },
    };
  }

  const userId = data.user?.id;
  if (userId && data.session) {
    await mergePendingInviteForProfile(userId, invite.phone);
    revalidatePath("/", "layout");
    return {
      message: "Účet je pripravený. Môžeete sa prihlásiť.",
    };
  }

  if (userId) {
    await prisma.profile.updateMany({
      where: { id: userId },
      data: { phone: invite.phone, fullName },
    });
  }

  return {
    ok: false,
    message:
      "Účet sme vytvorili. Skontrolujte si e-mail a potvrďte registráciu.",
    values: { fullName, email },
  };
}

function z_flatten(error: {
  issues: { path: PropertyKey[]; message: string }[];
}): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    (out[key] ??= []).push(issue.message);
  }
  return out;
}
