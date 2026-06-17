"use client";

import { useTransition } from "react";
import { Building2, Check, ChevronsUpDown } from "lucide-react";

import { setActiveContext } from "@/lib/auth/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export type OrgOption = { id: string; name: string };

type Props = {
  organizations: OrgOption[];
  activeId: string | null;
};

export function OrgSwitcher({ organizations, activeId }: Props) {
  const [pending, startTransition] = useTransition();
  const active = organizations.find((o) => o.id === activeId) ?? null;

  function switchTo(id: string) {
    if (id === activeId) return;
    startTransition(() => {
      void setActiveContext(id);
    });
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              disabled={pending}
              className="data-[state=open]:bg-sidebar-accent"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                <Building2 className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {active?.name ?? "Žiadna organizácia"}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {organizations.length > 0
                    ? "Prepnúť organizáciu"
                    : "Zatiaľ bez prístupu"}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Organizácie
            </DropdownMenuLabel>
            {organizations.length === 0 && (
              <DropdownMenuItem disabled>
                Žiadne dostupné organizácie
              </DropdownMenuItem>
            )}
            {organizations.map((org) => (
              <DropdownMenuItem
                key={org.id}
                onSelect={() => switchTo(org.id)}
                className="gap-2"
              >
                <span className="flex-1 truncate">{org.name}</span>
                {org.id === activeId && <Check className="size-4" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
