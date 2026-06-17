import type { Metadata } from "next";
import Link from "next/link";
import { Leaf, Clock, HeartHandshake, Store } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "O nás",
  description:
    "Box66 je fastfood franšíza postavená na čerstvých surovinách, poctivých receptúrach a rýchlej obsluhe.",
};

const VALUES = [
  {
    icon: Leaf,
    title: "Čerstvé suroviny",
    text: "Pracujeme len s overenými dodávateľmi a suroviny spracúvame priebežne počas dňa.",
  },
  {
    icon: Clock,
    title: "Rýchlo a načas",
    text: "Optimalizované procesy v kuchyni znamenajú, že na svoj box nečakáte zbytočne dlho.",
  },
  {
    icon: HeartHandshake,
    title: "Poctivé receptúry",
    text: "Každý produkt má jednotnú receptúru naprieč všetkými prevádzkami franšízy.",
  },
  {
    icon: Store,
    title: "Lokálne prevádzky",
    text: "Sme franšíza — za každou predajňou stojí miestny prevádzkar, ktorému na kvalite záleží.",
  },
] as const;

export default function AboutPage() {
  return (
    <>
      <section className="border-b bg-muted/30">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            O nás
          </p>
          <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Fastfood, ktorý sa nehanbí za to, čo má vnútri
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Box66 vznikol s jednoduchým cieľom — pripravovať rýchle jedlo, ktoré
            chutí a za ktorého zložením si stojíme. Pri každom jedle nájdete jeho
            zloženie aj alergény, aby ste presne vedeli, čo jete.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/menu">Pozrieť menu</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/kontakt">Kontaktujte nás</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2">
          {VALUES.map((value) => (
            <div
              key={value.title}
              className="flex gap-4 rounded-xl border bg-card p-6"
            >
              <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <value.icon className="size-5" />
              </div>
              <div className="space-y-1">
                <h2 className="font-medium">{value.title}</h2>
                <p className="text-sm text-muted-foreground">{value.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
