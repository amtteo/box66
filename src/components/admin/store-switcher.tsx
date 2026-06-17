"use client";

import { useTransition } from "react";
import { Check, ChevronsUpDown, Store as StoreIcon } from "lucide-react";

import { setActiveStore } from "@/lib/auth/actions";
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

export type StoreOption = { id: string; name: string };

type Props = {
  stores: StoreOption[];
  activeId: string | null;
};

export function StoreSwitcher({ stores, activeId }: Props) {
  const [pending, startTransition] = useTransition();
  const active = stores.find((s) => s.id === activeId) ?? null;

  function switchTo(id: string) {
    if (id === activeId) return;
    startTransition(() => {
      void setActiveStore(id);
    });
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              disabled={pending || stores.length === 0}
              className="data-[state=open]:bg-sidebar-accent"
            >
              <StoreIcon className="size-4" />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate">
                  {active?.name ??
                    (stores.length === 0 ? "Žiadna predajňa" : "Vyber predajňu")}
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
              Predajne
            </DropdownMenuLabel>
            {stores.length === 0 && (
              <DropdownMenuItem disabled>
                Žiadne dostupné predajne
              </DropdownMenuItem>
            )}
            {stores.map((store) => (
              <DropdownMenuItem
                key={store.id}
                onSelect={() => switchTo(store.id)}
                className="gap-2"
              >
                <span className="flex-1 truncate">{store.name}</span>
                {store.id === activeId && <Check className="size-4" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
