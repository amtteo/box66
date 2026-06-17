import type { Metadata } from "next";
import Link from "next/link";
import {
  Boxes,
  Building2,
  Store,
  Truck,
  Utensils,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getProfile, getAccess } from "@/lib/auth/dal";
import { getActiveContext } from "@/lib/auth/active-context";
import { getActiveStore, hasOrgRole } from "@/lib/auth/tenancy";
import { Role } from "@/lib/rbac";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Prehľad" };

type Stat = { title: string; value: number | string; hint: string; icon: LucideIcon };

export default async function AdminDashboardPage() {
  const [profile, access, active, activeStore] = await Promise.all([
    getProfile(),
    getAccess(),
    getActiveContext(),
    getActiveStore(),
  ]);

  const greetingName = profile?.fullName?.split(" ")[0] ?? "";
  const showOnboarding = !access.isSuperAdmin && !access.hasAnyMembership;

  const stats: Stat[] = [];

  if (access.isSuperAdmin) {
    const [orgs, products, recipes, suppliers] = await Promise.all([
      prisma.organization.count(),
      prisma.product.count(),
      prisma.recipe.count(),
      prisma.supplier.count(),
    ]);
    stats.push(
      { title: "Organizácie", value: orgs, hint: "Franšízanti platformy", icon: Building2 },
      {
        title: "Produkty",
        value: products,
        hint: `${recipes} s receptúrou`,
        icon: Boxes,
      },
      { title: "Dodávatelia", value: suppliers, hint: "Centrálne spravovaní", icon: Truck },
    );
  }

  const orgId = active.organizationId;
  const isOrgAdmin = orgId ? await hasOrgRole(orgId, Role.ADMIN) : false;

  if (orgId && isOrgAdmin) {
    const stores = await prisma.store.count({ where: { organizationId: orgId } });
    stats.push({ title: "Predajne", value: stores, hint: "V tvojej organizácii", icon: Store });
  }

  if (activeStore.store) {
    const storeId = activeStore.store.id;
    const [menuCount, inventory] = await Promise.all([
      prisma.menuItem.count({ where: { storeId } }),
      prisma.inventoryItem.findMany({
        where: { storeId, reorderLevel: { not: null } },
        select: { quantity: true, reorderLevel: true },
      }),
    ]);
    const lowCount = inventory.filter(
      (i) => i.reorderLevel != null && Number(i.quantity) <= Number(i.reorderLevel),
    ).length;
    stats.push(
      {
        title: "Položky menu",
        value: menuCount,
        hint: activeStore.store.name,
        icon: Utensils,
      },
      {
        title: "Sklad: doobjednať",
        value: lowCount,
        hint: "Pod hladinou zásob",
        icon: Warehouse,
      },
    );
  }

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Vitaj{greetingName ? `, ${greetingName}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground">
          {active.organization
            ? `Aktívna organizácia: ${active.organization.name}${
                activeStore.store ? ` · ${activeStore.store.name}` : ""
              }`
            : "Prehľad tvojej administrácie."}
        </p>
      </div>

      {showOnboarding && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Ešte nemáš priradenú organizáciu</CardTitle>
            <CardDescription>
              Tvoj účet je vytvorený, no zatiaľ nie si členom žiadnej organizácie
              ani predajne. Požiadaj administrátora o priradenie — potom tu uvidíš
              prehľad svojej prevádzky.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {access.isSuperAdmin && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">Si superadmin platformy</CardTitle>
            <CardDescription>
              Spravuj{" "}
              <Link href="/admin/organizacie" className="font-medium underline underline-offset-4">
                organizácie
              </Link>{" "}
              a{" "}
              <Link href="/admin/katalog" className="font-medium underline underline-offset-4">
                globálny katalóg
              </Link>
              . Po priradení do organizácie sa ti sprístupní jej prevádzka.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {stats.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.hint}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
