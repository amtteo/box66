import type { Metadata } from "next";

import { SignInForm } from "@/components/auth/sign-in-form";
import { safeRedirectPath } from "@/lib/auth/redirect";

export const metadata: Metadata = { title: "Prihlásenie" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;
  const redirectTo = safeRedirectPath(redirect, "/");

  return <SignInForm redirectTo={redirectTo} />;
}
