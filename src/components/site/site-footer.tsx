import Link from "next/link";

import { Logo } from "@/components/brand/logo";

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-foreground text-background">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div className="space-y-3 flex flex-col">
          <Link href="/" className="inline-flex text-background">
            <Logo />
            <span className="sr-only">Box66</span>
          </Link>
          <p className="text-md font-bold">
            Your favourite box
          </p>
          <img src="/mascot.png" alt="Box66" className="w-30 h-auto" />
        </div>

        <div className="space-y-3">
          <h3 className="text-2xl font-bold mb-4">Navigácia</h3>
          <ul className="space-y-2 text-lg text-background/70">
            <li>
              <Link href="/" className="hover:text-background">
                Objednať online
              </Link>
            </li>
            <li>
              <Link href="/menu" className="hover:text-background">
                Naše menu
              </Link>
            </li>
            <li>
              <Link href="/dodavatelia" className="hover:text-background">
                Pre dodávateľov
              </Link>
            </li>
            <li>
              <Link href="/kontakt" className="hover:text-background">
                Kontakt
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="text-2xl font-bold mb-4">Právne informácie</h3>
          <ul className="space-y-2 text-lg text-background/70">
            <li>
              <Link href="/obchodne-podmienky" className="hover:text-background">
                Obchodné podmienky
              </Link>
            </li>
            <li>
              <Link href="/ochrana-osobnych-udajov" className="hover:text-background">
                Ochrana osobných údajov (GDPR)
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-background/10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-8 text-xsm text-background/60 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} Box66. Všetky práva vyhradené.</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <Link href="/obchodne-podmienky" className="hover:text-background">
              Obchodné podmienky
            </Link>
            <Link href="/ochrana-osobnych-udajov" className="hover:text-background">
              GDPR
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
