"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const NAV = [
  { href: "/menu", label: "Menu" },
  { href: "/o-nas", label: "O nás" },
  { href: "/kontakt", label: "Kontakt" },
] as const;

export function SiteHeader({ isAuthed }: { isAuthed: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const loginRedirect =
    pathname === "/prihlasenie" || pathname === "/registracia"
      ? "/"
      : pathname;
  const loginHref = isAuthed
    ? "/admin"
    : `/prihlasenie?redirect=${encodeURIComponent(loginRedirect)}`;

  return (
    <header className="sticky top-0 z-40 border-b-2 border-primary bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex items-center text-foreground">
          <Logo />
          <span className="sr-only">Box66</span>
        </Link>

        <nav className="hidden flex-1 items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Button
              key={item.href}
              asChild
              variant="ghost"
              size="sm"
              className={cn(
                "text-muted-foreground",
                isActive(item.href) && "text-foreground",
              )}
            >
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href={loginHref}>
              {isAuthed ? "Administrácia" : "Prihlásiť sa"}
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/">Objednať</Link>
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon-sm" className="md:hidden">
                <Menu className="size-4" />
                <span className="sr-only">Otvoriť menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="flex items-center">
                  <Logo />
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-2">
                {NAV.map((item) => (
                  <SheetClose asChild key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "rounded-md px-3 py-2 text-sm font-medium hover:bg-accent",
                        isActive(item.href)
                          ? "bg-accent text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {item.label}
                    </Link>
                  </SheetClose>
                ))}
                <SheetClose asChild>
                  <Link
                    href={loginHref}
                    className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
                  >
                    {isAuthed ? "Administrácia" : "Prihlásiť sa"}
                  </Link>
                </SheetClose>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
