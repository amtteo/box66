import type { Metadata } from "next";
import Image from "next/image";

import { SupplierInquiryForm } from "@/components/site/supplier-inquiry-form";

export const metadata: Metadata = {
  title: "Pre dodávateľov",
  description:
    "Hľadáme spoľahlivých partnerov pre náš fast-food koncept. Pošlite nám svoju ponuku.",
};

const VALUES = [
  "konzistentnú kvalitu produktov",
  "ochotu prispôsobiť sa našim špecifikáciám",
  "flexibilitu pri vývoji a testovaní",
  "transparentnú komunikáciu",
  "možnosť dodania vzoriek",
  "záujem o dlhodobé partnerstvo",
] as const;

export default function SuppliersPage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-8 px-4 py-16 sm:px-6 sm:py-20 md:grid-cols-2">
          <div className="col-span-1">
            <h1 className="mt-2 text-6xl font-bold tracking-tight sm:text-7xl">
              Hľadáme partnerov
            </h1>
            <p className="mt-4 text-xl">
              Budujeme modernú franšízovú sieť zameranú na kvalitu, rýchlosť a
              efektivitu. Naším cieľom je prinášať zákazníkom prvotriedny produkt,
              a preto hľadáme stabilných a spoľahlivých partnerov, ktorí budú rásť
              spolu s nami. Máte produkt alebo službu, ktorá spĺňa najvyššie
              štandardy gastronómie? Dajte nám o sebe vedieť.
            </p>
          </div>
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl col-span-1">
            <Image
              src="/supplierhero.png"
              alt="Box66"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          </div>
        </div>
      </section>

      <section className="w-full bg-red-600 text-white">
      <div className="mx-auto w-full px-4 sm:px-6 py-36 max-w-6xl">
        <div className="grid gap-56 lg:grid-cols-2">

        <div className="flex flex-col justify-center">
            <p className="text-4xl font-bold">
               Naším cieľom nie je budovanie stabilnej siete partnerov, s
              ktorými budeme rásť.
            </p>
            <p className="text-xl mt-6">
              Hľadáme dodávateľov, ktorí chcú byť pri vzniku nového fast-food
              konceptu a spoločne hľadať optimálne riešenia pre dlhodobú spoluprácu.
              </p>
          </div>

          <div className="space-y-5 ">
            <div className="space-y-4 text-4xl">
              <p className="font-bold">
                Oceníme najmä
              </p>
              <ul className="list-inside list-disc space-y-1.5 text-xl">
                {VALUES.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        </div>
      </section>

      <section className="">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-8 px-4 py-16 sm:px-6 sm:py-20 md:grid-cols-2">
          <div className="relative aspect-[4/4] w-full overflow-hidden rounded-xl col-span-1">
            <Image
              src="/custom6.webp"
              alt="Box66"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          </div>
          <div className="mt-6 col-span-1">
          <h3 className="text-4xl font-bold mb-3">Potraviny a suroviny</h3>
            <p className="text-xl">
               Výrobcovia a distribútori
              čerstvého hovädzieho mäsa, burgerové žemle, dodávatelia omáčok,
              syrov a čerstvej zeleniny.
            </p>
            <h3 className="text-4xl font-bold mt-18 mb-3">Obalové materiály</h3>
            <p className="text-xl">
              Ekologické, funkčné a brandované obaly na burgre, boxy, tašky a
              hygienické potreby.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl pb-46">
        <div className="grid md:grid-cols-2 gap-8 py-12 px-4 sm:px-6 sm:py-16">
          <div className="col-span-1 flex items-center">
          <p className="mt-2 text-4xl sm:text-6xl font-bold">
            Vyplňte formulár a budeme Vás kontaktovať
          </p>
          </div>
          <div className="mt-8 col-span-1">
            <div className="rounded-xl border border-primary p-6 sm:p-8">
            <SupplierInquiryForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
