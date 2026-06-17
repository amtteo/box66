"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo } from "@/components/brand/logo";

const titles: Record<string, string> = {
  "/prihlasenie": "Prihlásenie",
  "/registracia": "Registrácia",
};

export function AuthHeader() {
  const pathname = usePathname();
  const title = titles[pathname] ?? "Prihlásenie";

  return (
    <div className="mb-8 flex-col font-bold text-center flex justify-center items-center gap-2">
      <Link href="/" className="flex shrink-0 items-center text-foreground">
        <Logo />
        <span className="sr-only">Box66</span>
      </Link>
      {title}
    </div>
  );
}
