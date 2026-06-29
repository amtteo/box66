"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import {
  SignInSchema,
  SignUpSchema,
  type AuthFormState,
  type CheckoutSignInState,
} from "@/lib/auth/schemas";
import {
  ACTIVE_ORG_COOKIE,
  ACTIVE_STORE_COOKIE,
} from "@/lib/auth/active-context";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { cookies } from "next/headers";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 dní

export async function signIn(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = SignInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      errors: z_flatten(parsed.error),
      values: { email: String(formData.get("email") ?? "") },
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return {
      ok: false,
      message: "Nesprávny e-mail alebo heslo.",
      values: { email: parsed.data.email },
    };
  }

  const { data: sessionData } = await supabase.auth.getUser();
  if (sessionData.user?.id) {
    await mergeAfterAuth(sessionData.user.id);
  }

  revalidatePath("/", "layout");
  redirect(safeRedirectPath(formData.get("redirect"), "/"));
}

/** Prihlásenie v košíku — bez presmerovania, vráti údaje zákazníka na predvyplnenie. */
export async function signInForCheckout(
  _prev: CheckoutSignInState,
  formData: FormData,
): Promise<CheckoutSignInState> {
  const parsed = SignInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      errors: z_flatten(parsed.error),
      values: { email: String(formData.get("email") ?? "") },
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return {
      ok: false,
      message: "Nesprávny e-mail alebo heslo.",
      values: { email: parsed.data.email },
    };
  }

  const profile = data.user
    ? await prisma.profile.findUnique({ where: { id: data.user.id } })
    : null;

  if (data.user?.id) {
    await mergeAfterAuth(data.user.id);
  }

  revalidatePath("/", "layout");

  return {
    ok: true,
    customer: {
      name: profile?.fullName ?? undefined,
      email: profile?.email ?? parsed.data.email,
    },
  };
}

export async function signUp(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = SignUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      errors: z_flatten(parsed.error),
      values: {
        fullName: String(formData.get("fullName") ?? ""),
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
      // Ukladá sa do user_metadata; trigger handle_new_user z toho naplní profil.
      // Pozn.: user_metadata je editovateľné používateľom — NIE je to autorizačný údaj.
      data: { full_name: fullName },
    },
  });

  if (error) {
    return {
      ok: false,
      message:
        error.code === "user_already_exists" ||
        /already/i.test(error.message)
          ? "Účet s týmto e-mailom už existuje."
          : "Registráciu sa nepodarilo dokončiť. Skús to znova.",
      values: { fullName, email },
    };
  }

  // Ak je zapnuté potvrdenie e-mailom, session ešte nie je k dispozícii.
  if (!data.session) {
    return {
      ok: false,
      message:
        "Účet sme vytvorili. Skontroluj si e-mail a potvrď registráciu, potom sa prihlás.",
    };
  }

  revalidatePath("/", "layout");
  redirect(safeRedirectPath(formData.get("redirect"), "/"));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

/** Prepne aktívnu organizáciu/predajňu (uloží do cookies). */
export async function setActiveContext(
  organizationId: string,
  storeId?: string | null,
) {
  const jar = await cookies();
  jar.set(ACTIVE_ORG_COOKIE, organizationId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  if (storeId) {
    jar.set(ACTIVE_STORE_COOKIE, storeId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });
  } else {
    jar.delete(ACTIVE_STORE_COOKIE);
  }

  revalidatePath("/admin", "layout");
}

/** Prepne aktívnu predajňu v rámci aktuálnej organizácie (uloží do cookie). */
export async function setActiveStore(storeId: string) {
  const jar = await cookies();
  jar.set(ACTIVE_STORE_COOKIE, storeId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
  revalidatePath("/admin", "layout");
}

/** Pomocník: zod chyby do plochej mapy `pole -> [správy]`. */
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

async function mergeAfterAuth(userId: string) {
  const { tryMergePendingInviteForProfile } = await import(
    "@/lib/customer-invite/merge"
  );
  await tryMergePendingInviteForProfile(userId);
}
