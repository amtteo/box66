"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin/katalog/kategorie", label: "Kategórie" },
  { href: "/admin/katalog/produkty", label: "Produkty" },
  { href: "/admin/katalog/ingrediencie", label: "Ingrediencie" },
  { href: "/admin/katalog/dodavatelia", label: "Dodávatelia" },
];

export function CatalogNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b">
      {TABS.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
