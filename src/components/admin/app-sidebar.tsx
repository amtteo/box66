"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  Building2,
  LayoutDashboard,
  Receipt,
  Store,
  Users,
  Utensils,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { OrgSwitcher, type OrgOption } from "@/components/admin/org-switcher";
import { StoreSwitcher, type StoreOption } from "@/components/admin/store-switcher";
import { UserMenu } from "@/components/admin/user-menu";

/** Prepínače viditeľnosti položiek podľa oprávnení (počíta sa v layoute). */
export type SidebarCaps = {
  store: boolean;
  orgAdmin: boolean;
  superAdmin: boolean;
};

type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  cap: keyof SidebarCaps | "always";
};

const PREVADZKA: NavItem[] = [
  { title: "Prehľad", href: "/admin", icon: LayoutDashboard, cap: "always" },
  { title: "Objednávky", href: "/admin/objednavky", icon: Receipt, cap: "store" },
  { title: "Menu", href: "/admin/menu", icon: Utensils, cap: "store" },
  { title: "Sklad", href: "/admin/sklad", icon: Warehouse, cap: "store" },
];

const FRANSIZA: NavItem[] = [
  { title: "Predajne", href: "/admin/predajne", icon: Store, cap: "orgAdmin" },
  { title: "Tím a role", href: "/admin/tim", icon: Users, cap: "orgAdmin" },
];

const PLATFORMA: NavItem[] = [
  { title: "Katalóg produktov", href: "/admin/katalog", icon: Boxes, cap: "superAdmin" },
  { title: "Organizácie", href: "/admin/organizacie", icon: Building2, cap: "superAdmin" },
];

type Props = {
  user: { name: string; email: string; roleLabel: string };
  organizations: OrgOption[];
  activeOrgId: string | null;
  stores: StoreOption[];
  activeStoreId: string | null;
  caps: SidebarCaps;
};

export function AppSidebar({
  user,
  organizations,
  activeOrgId,
  stores,
  activeStoreId,
  caps,
}: Props) {
  const pathname = usePathname();

  function visible(items: NavItem[]) {
    return items.filter((i) => i.cap === "always" || caps[i.cap]);
  }

  function renderGroup(label: string, items: NavItem[]) {
    const shown = visible(items);
    if (shown.length === 0) return null;
    return (
      <SidebarGroup>
        <SidebarGroupLabel>{label}</SidebarGroupLabel>
        <SidebarMenu>
          {shown.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroup>
    );
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <OrgSwitcher organizations={organizations} activeId={activeOrgId} />
        {caps.store && stores.length > 0 && (
          <StoreSwitcher stores={stores} activeId={activeStoreId} />
        )}
      </SidebarHeader>
      <SidebarContent>
        {renderGroup("Prevádzka", PREVADZKA)}
        {renderGroup("Franšíza", FRANSIZA)}
        {renderGroup("Platforma", PLATFORMA)}
      </SidebarContent>
      <SidebarFooter>
        <UserMenu name={user.name} email={user.email} roleLabel={user.roleLabel} />
      </SidebarFooter>
    </Sidebar>
  );
}
