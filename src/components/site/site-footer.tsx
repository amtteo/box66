import Link from "next/link";

import { Logo } from "@/components/brand/logo";

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-foreground text-background">
      <div className="">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-24 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3 flex flex-col items-start">
          <Link href="/" className="inline-flex text-background">
            <Logo />
            <span className="sr-only">Box66</span>
          </Link>
          <p className="text-md font-bold border-b-2 border-background pb-4">
            Your favourite box
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-2xl font-bold mb-4">Navigácia</h3>
          <ul className="space-y-3 text-md text-background/70">
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
          <h3 className="text-2xl font-bold mb-4">Prevádzka</h3>
          <ul className="space-y-3 text-md text-background/70">
            <li>
              <a href="/pos.apk" className="hover:text-background">
                Aplikácia POS
              </a>
            </li>
            <li>
              <a href="/kds.apk" className="hover:text-background">
                Aplikácia Kuchyňa
              </a>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="text-2xl font-bold mb-4">Právne informácie</h3>
          <ul className="space-y-3 text-md text-background/70">
            <li>
              <Link href="/obchodne-podmienky" className="hover:text-background">
                Obchodné podmienky
              </Link>
            </li>
            <li>
              <Link
                href="/podmienky-online-objednavania-a-platieb"
                className="hover:text-background"
              >
                Online objednávky
              </Link>
            </li>
            <li>
              <Link href="/ochrana-osobnych-udajov" className="hover:text-background">
                GDPR
              </Link>
            </li>
          </ul>
        </div>
      </div>
      </div>

      <div className="">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-18 text-sm text-background/60 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} Box66. Všetky práva vyhradené.</p>
        </div>
      </div>
    </footer>
  );
}
