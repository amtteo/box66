import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { NewUserSignUpForm } from "@/components/auth/new-user-sign-up-form";
import { getPendingInviteByToken } from "@/lib/customer-invite/queries";

export const metadata: Metadata = { title: "Dokončenie registrácie" };

export default async function NewUserPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await getPendingInviteByToken(token);
  if (!invite) notFound();

  return (
    <NewUserSignUpForm
      token={invite.token}
      phone={invite.phone}
      fullName={invite.fullName}
    />
  );
}
