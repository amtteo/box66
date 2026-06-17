import Link from "next/link";
import { MapPin, Phone, Mail } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import type { StoreContact } from "@/lib/menu/presentation";

export function SiteFooter({ store }: { store: StoreContact | null }) {
  const addressLine = store
    ? [store.street, [store.postalCode, store.city].filter(Boolean).join(" ")]
        .filter(Boolean)
        .join(", ")
    : null;

  return (
    <footer className="mt-auto border-t border-background/10 bg-foreground text-background">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div className="space-y-3">
          <Link href="/" className="inline-flex text-background">
            <Logo />
            <span className="sr-only">Box66</span>
          </Link>
          <p className="max-w-xs text-sm text-background/70">
            Your favourite box
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Navigácia</h3>
          <ul className="space-y-2 text-sm text-background/70">
            <li>
              <Link href="/menu" className="hover:text-background">
                Menu
              </Link>
            </li>
            <li>
              <Link href="/o-nas" className="hover:text-background">
                O nás
              </Link>
            </li>
            <li>
              <Link href="/kontakt" className="hover:text-background">
                Kontakt
              </Link>
            </li>
            <li>
              <Link href="/" className="hover:text-background">
                Objednať online
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold">{store?.name ?? "Box66"}</h3>
          <ul className="space-y-2 text-sm text-background/70">
            {addressLine && (
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0" />
                <span>{addressLine}</span>
              </li>
            )}
            {store?.phone && (
              <li className="flex items-center gap-2">
                <Phone className="size-4 shrink-0" />
                <a href={`tel:${store.phone}`} className="hover:text-background">
                  {store.phone}
                </a>
              </li>
            )}
            {store?.email && (
              <li className="flex items-center gap-2">
                <Mail className="size-4 shrink-0" />
                <a
                  href={`mailto:${store.email}`}
                  className="hover:text-background"
                >
                  {store.email}
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-background/10">
        <div className="mx-auto w-full max-w-6xl px-4 py-4 text-center text-xs text-background/60 sm:px-6">
          © {new Date().getFullYear()} Box66. Všetky práva vyhradené.
        </div>
      </div>
    </footer>
  );
}
