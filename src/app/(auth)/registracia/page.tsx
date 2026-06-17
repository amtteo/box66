import type { Metadata } from "next";

import { SignUpForm } from "@/components/auth/sign-up-form";
import { safeRedirectPath } from "@/lib/auth/redirect";

export const metadata: Metadata = { title: "Registrácia" };

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;
  const redirectTo = safeRedirectPath(redirect, "/");

  return <SignUpForm redirectTo={redirectTo} />;
}
