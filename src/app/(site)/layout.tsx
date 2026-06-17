import { getUser } from "@/lib/auth/dal";
import { getStoreContact } from "@/lib/menu/presentation";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";

export default async function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [user, store] = await Promise.all([getUser(), getStoreContact()]);

  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader isAuthed={!!user} />
      <main className="flex flex-1 flex-col">{children}</main>
      <SiteFooter store={store} />
    </div>
  );
}
