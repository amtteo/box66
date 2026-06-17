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
  { href: "/menu", label: "Naše menu" },
  { href: "/kontakt", label: "Kontakt" },
] as const;

const navButtonClass =
  "bg-yellow-400 font-bold text-primary hover:bg-yellow-500";

const mobileNavButtonClass = cn(
  "h-auto w-fit px-4 py-2 text-3xl",
  navButtonClass,
);

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

  const loginLabel = isAuthed ? "Administrácia" : "Prihlásiť sa";

  return (
    <header className="sticky top-0 z-40 border-b-0 sm:border-b-2 border-primary bg-background">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center text-foreground">
          <Logo />
          <span className="sr-only">Box66</span>
        </Link>

        <nav className="hidden flex-1 items-center gap-4 md:ml-12 md:flex lg:ml-18 lg:gap-8">
          {isActive("/") ? (
            <Button asChild size="sm" className={navButtonClass}>
              <Link href="/">Objednať</Link>
            </Button>
          ) : (
            <Link href="/" className="text-md font-bold text-foreground">
              Objednať
            </Link>
          )}
          {NAV.map((item) =>
            isActive(item.href) ? (
              <Button
                key={item.href}
                asChild
                size="sm"
                className={navButtonClass}
              >
                <Link href={item.href}>{item.label}</Link>
              </Button>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="text-md font-bold text-foreground"
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="ml-auto flex items-center gap-3 md:ml-0">
          <Link
            href={loginHref}
            className="hidden text-md font-bold text-foreground sm:inline-flex"
          >
            {loginLabel}
          </Link>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
              >
                <Menu className="size-6" />
                <span className="sr-only">Otvoriť menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-md gap-10 p-12">
              <SheetHeader className="p-0">
                <SheetTitle className="flex items-center">
                  <Logo />
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-10">
                {isActive("/") ? (
                  <SheetClose asChild>
                    <Button asChild className={mobileNavButtonClass}>
                      <Link href="/">Objednať</Link>
                    </Button>
                  </SheetClose>
                ) : (
                  <SheetClose asChild>
                    <Link
                      href="/"
                      className="text-3xl font-bold text-foreground"
                    >
                      Objednať
                    </Link>
                  </SheetClose>
                )}
                {NAV.map((item) =>
                  isActive(item.href) ? (
                    <SheetClose asChild key={item.href}>
                      <Button asChild className={mobileNavButtonClass}>
                        <Link href={item.href}>{item.label}</Link>
                      </Button>
                    </SheetClose>
                  ) : (
                    <SheetClose asChild key={item.href}>
                      <Link
                        href={item.href}
                        className="text-3xl font-bold text-foreground"
                      >
                        {item.label}
                      </Link>
                    </SheetClose>
                  ),
                )}
                <SheetClose asChild>
                  <Link
                    href={loginHref}
                    className="text-3xl font-bold text-foreground"
                  >
                    {loginLabel}
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
