import { redirect } from "next/navigation";

export default async function ProductRecipePage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  redirect(`/admin/katalog/produkty?panel=recipe&item=${productId}`);
}
