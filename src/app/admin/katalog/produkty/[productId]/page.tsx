import { redirect } from "next/navigation";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  redirect(`/admin/katalog/produkty?panel=recipe&item=${productId}`);
}
