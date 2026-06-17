import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

export default async function LegacyRecipeRedirectPage({
  params,
}: {
  params: Promise<{ recipeId: string }>;
}) {
  const { recipeId } = await params;

  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    select: { productId: true },
  });
  if (!recipe) notFound();

  redirect(`/admin/katalog/produkty/${recipe.productId}/receptura`);
}
