"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, User } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { signOut } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  { href: "/dodavatelia", label: "Pre dodávateľov" },
  { href: "/kontakt", label: "Kontakt" },
] as const;

const AUTHED_MENU = [
  { href: "/", label: "Objednať" },
  { href: "/menu", label: "Naše menu" },
  { href: "/kontakt", label: "Kontakt" },
  { href: "/admin", label: "Administrácia" },
] as const;

const navButtonClass =
  "bg-yellow-400 font-bold text-primary hover:bg-yellow-500";

const mobileNavButtonClass = cn(
  "h-auto w-fit px-4 py-2 text-3xl",
  navButtonClass,
);

function SiteUserMenu() {
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const menuItemClass = (href: string) =>
    cn(
      "text-xl font-bold py-3 border-2 border-transparent data-[highlighted]:bg-transparent focus:bg-transparent mb-2",
      isActive(href)
        ? cn(navButtonClass, "focus:bg-yellow-400 data-[highlighted]:bg-yellow-400")
        : "focus:text-primary data-[highlighted]:border-primary data-[highlighted]:text-primary",
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-foreground focus:outline-none focus-visible:border-transparent focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=open]:ring-0 data-[state=open]:outline-none"
        >
          <User className="size-7" />
          <span className="sr-only">Používateľské menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-78 p-6 border-2 border-primary">
        {AUTHED_MENU.map((item) => (
          <DropdownMenuItem
            key={item.href}
            asChild
            className={menuItemClass(item.href)}
          >
            <Link href={item.href}>{item.label}</Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem
          className="text-xl font-bold py-3 border-2 border-transparent data-[highlighted]:bg-transparent focus:bg-transparent focus:text-primary data-[highlighted]:border-primary data-[highlighted]:text-primary"
          onSelect={(e) => {
            e.preventDefault();
            startTransition(() => {
              void signOut();
            });
          }}
        >
          Odhlásiť sa
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SiteHeader({ isAuthed }: { isAuthed: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const loginRedirect =
    pathname === "/prihlasenie" || pathname === "/registracia"
      ? "/"
      : pathname;
  const loginHref = `/prihlasenie?redirect=${encodeURIComponent(loginRedirect)}`;
  const loginLabel = "Prihlásiť sa";

  return (
    <header className="sticky top-0 z-40 border-b-0 sm:border-b-2 border-primary bg-background">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center text-foreground">
          <Logo />
          <span className="sr-only">Box66</span>
        </Link>

        {!isAuthed ? (
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
        ) : (
          <div className="flex-1" />
        )}

        <div className="ml-auto flex items-center gap-3 md:ml-0">
          {isAuthed ? (
            <SiteUserMenu />
          ) : (
            <>
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
                <SheetContent side="right" className="w-full max-w-md gap-10 px-12 pb-12 pt-24">
                  <SheetHeader className="p-0">
                    <SheetTitle className="flex items-center">
                      <Logo iconClassName="h-6" textClassName="h-4" className="gap-1.5" />
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
            </>
          )}
        </div>
      </div>
    </header>
  );
}
