"use client";

import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { LegalPageShell, LEGAL_SECTION_BLOCK } from "@/components/site/legal-page-shell";

const UPDATED_AT = "20. júna 2026";

const FAQ_ITEMS = [
  {
    question:
      "Z môjho účtu bola strhnutá nesprávna suma za objednávku. Ako to môžem riešiť?",
    answer: (
      <>
        Ospravedlňujeme sa za technické problémy. Skontrolujte, či sú pri
        platbe správne zadané údaje platobnej karty a či sa suma v košíku
        pred odoslaním objednávky zhoduje s účtovanou sumou. Ak problém
        pretrváva, kontaktujte svoju banku alebo vydavateľa platobnej karty.
        Ak sa situácia nevyrieši, obráťte sa na našu{" "}
        <Link href="/kontakt" className="text-primary hover:underline">
          zákaznícku podporu
        </Link>
        .
      </>
    ),
  },
  {
    question:
      "Pokúsil som sa objednať cez web alebo aplikáciu, ale transakciu sa mi nepodarilo dokončiť. Ako môžem objednávku zrealizovať?",
    answer: (
      <>
        Ospravedlňujeme sa za technické problémy. Skontrolujte, či sú pri
        platbe správne zadané údaje platobnej karty a či máte stabilné
        internetové pripojenie. Skúste objednávku zopakovať alebo zvoliť iný
        spôsob platby, ak je k dispozícii. Ak problém pretrváva, kontaktujte
        svoju banku. Ak sa situácia nevyrieši, obráťte sa na našu{" "}
        <Link href="/kontakt" className="text-primary hover:underline">
          zákaznícku podporu
        </Link>
        .
      </>
    ),
  },
  {
    question: "Moja objednávka neprešla, ale peniaze mi boli strhnuté.",
    answer: (
      <>
        Ospravedlňujeme sa za technické problémy. Pri neúspešnej objednávke sa
        platba zvyčajne automaticky vráti na váš účet v lehote stanovenej vašou
        bankou. Ak refundácia nedorazí, kontaktujte našu{" "}
        <Link href="/kontakt" className="text-primary hover:underline">
          zákaznícku podporu
        </Link>{" "}
        a uveďte číslo objednávky alebo potvrdenie o platbe.
      </>
    ),
  },
  {
    question: "Objednal som online, ale objednávka nikdy nedorazila.",
    answer: (
      <>
        Ospravedlňujeme sa, že vaša objednávka nedorazila. Skontrolujte, či ste
        uviedli správnu adresu doručenia a telefónne číslo. Ak je všetko v
        poriadku, kontaktujte našu{" "}
        <Link href="/kontakt" className="text-primary hover:underline">
          zákaznícku podporu
        </Link>{" "}
        a uveďte číslo objednávky.
      </>
    ),
  },
  {
    question: "Chcem zrušiť objednávku.",
    answer: (
      <>
        Po potvrdení objednávky zrušenie zvyčajne nie je možné. Ak máte
        mimoriadnu situáciu, kontaktujte čo najskôr našu{" "}
        <Link href="/kontakt" className="text-primary hover:underline">
          zákaznícku podporu
        </Link>{" "}
        alebo priamo prevádzku, u ktorej ste objednávali. Posúdime vašu
        požiadavku individuálne.
      </>
    ),
  },
  {
    question: "Objednávka bola doručená, ale obsah bol poškodený.",
    answer: (
      <>
        Ospravedlňujeme sa, že objednávka nedorazila v očakávanom stave.
        Kontaktujte prosím prevádzku, u ktorej ste objednávali — kontaktné
        údaje nájdete na stránke{" "}
        <Link href="/kontakt" className="text-primary hover:underline">
          Kontakt
        </Link>
        . Ak sa problém nevyrieši, obráťte sa na našu zákaznícku podporu.
      </>
    ),
  },
  {
    question:
      "Objednávka bola doručená, ale obsah nezodpovedal mojej objednávke.",
    answer: (
      <>
        Ospravedlňujeme sa, že objednávka nedorazila podľa očakávania.
        Kontaktujte prosím prevádzku, u ktorej ste objednávali — kontaktné
        údaje nájdete na stránke{" "}
        <Link href="/kontakt" className="text-primary hover:underline">
          Kontakt
        </Link>
        . Ak sa problém nevyrieši, obráťte sa na našu zákaznícku podporu.
      </>
    ),
  },
  {
    question:
      "Použil som zľavový kód alebo kupón, ale akcia sa neuplatnila správne.",
    answer: (
      <>
        Ospravedlňujeme sa za nepríjemnosť. Skontrolujte, či kupón spĺňa
        podmienky akcie (minimálna suma objednávky, platnosť, vybraná prevádzka
        alebo produkty). Ak sa zľava napriek tomu neuplatnila, kontaktujte našu{" "}
        <Link href="/kontakt" className="text-primary hover:underline">
          zákaznícku podporu
        </Link>{" "}
        a uveďte číslo objednávky a použitý kód.
      </>
    ),
  },
];

export default function OnlineOrderingTermsPage() {
  return (
    <LegalPageShell
      title="Podmienky online objednávania a platieb"
      description="Tieto podmienky upravujú používanie online objednávania a platieb prostredníctvom webovej stránky a mobilnej aplikácie Box66."
      updatedAt={UPDATED_AT}
    >
      <section className="">
        <p className="text-lg font-bold">
          Odoslaním objednávky zákazník potvrdzuje, že sa oboznámil s týmito
          podmienkami a súhlasí s nimi.
        </p>
      </section>

      <section className={LEGAL_SECTION_BLOCK}>
        <h2>Dostupnosť služieb</h2>
        <ul>
          <li>
            Online objednávanie je dostupné iba vo vybraných lokalitách a počas
            otváracích hodín konkrétnej prevádzky.
          </li>
          <li>
            Ponuka produktov, ceny a dostupnosť sa môžu líšiť podľa predajne.
          </li>
          <li>Niektoré produkty môžu byť dočasne nedostupné.</li>
        </ul>
      </section>

      <section className={LEGAL_SECTION_BLOCK}>
        <h2>Objednávka</h2>
        <p>
          Pri vytváraní objednávky je zákazník povinný uviesť správne a úplné
          údaje.
        </p>
        <p>Pred odoslaním objednávky si zákazník skontroluje:</p>
        <ul>
          <li>vybranú prevádzku,</li>
          <li>spôsob doručenia alebo vyzdvihnutia,</li>
          <li>adresu doručenia,</li>
          <li>kontaktné údaje,</li>
          <li>obsah objednávky.</li>
        </ul>
        <p>
          Po potvrdení objednávky nie je možné garantovať jej zmenu alebo
          zrušenie.
        </p>
      </section>

      <section className={LEGAL_SECTION_BLOCK}>
        <h2>Doručenie</h2>
        <ul>
          <li>
            Doručenie je dostupné iba v rámci doručovacej zóny konkrétnej
            prevádzky.
          </li>
          <li>
            Cena doručenia, minimálna hodnota objednávky a odhadovaný čas
            doručenia sa môžu líšiť podľa adresy a prevádzky.
          </li>
          <li>
            Ak zákazník nie je dostupný na uvedenom telefónnom čísle alebo nie
            je možné objednávku doručiť z dôvodu nesprávne uvedenej adresy,
            Box66 si vyhradzuje právo objednávku zrušiť bez nároku na vrátenie
            nákladov spojených s doručením.
          </li>
          <li>Uvedené časy doručenia sú orientačné.</li>
        </ul>
      </section>

      <section className={LEGAL_SECTION_BLOCK}>
        <h2>Ceny a platby</h2>
        <ul>
          <li>Všetky ceny sú uvedené vrátane DPH.</li>
          <li>
            Cena doručenia a prípadné ďalšie poplatky sú zákazníkovi zobrazené
            pred dokončením objednávky.
          </li>
          <li>
            Platbu je možné uskutočniť spôsobmi dostupnými pri dokončení
            objednávky.
          </li>
        </ul>
      </section>

      <section className={LEGAL_SECTION_BLOCK}>
        <h2>Reklamácie</h2>
        <p>
          Ak objednávka nebola doručená správne alebo zákazník nie je spokojný s
          kvalitou produktu, môže nás kontaktovať prostredníctvom{" "}
          <Link href="/kontakt" className="text-primary hover:underline">
            zákazníckej podpory
          </Link>
          .
        </p>
        <p>Každá reklamácia bude posudzovaná individuálne.</p>
      </section>

      <section className={LEGAL_SECTION_BLOCK}>
        <h2>Ochrana osobných údajov</h2>
        <p>
          Osobné údaje spracúvame výlučne za účelom vybavenia objednávky a v
          súlade s platnými právnymi predpismi.
        </p>
        <p>
          Viac informácií nájdete v dokumente{" "}
          <Link
            href="/ochrana-osobnych-udajov"
            className="text-primary hover:underline"
          >
            Ochrana osobných údajov
          </Link>
          .
        </p>
      </section>

      <section className={LEGAL_SECTION_BLOCK}>
        <h2>Záverečné ustanovenia</h2>
        <ul>
          <li>Box66 si vyhradzuje právo tieto podmienky kedykoľvek aktualizovať.</li>
          <li>
            Aktuálna verzia podmienok je vždy dostupná na webovej stránke Box66.
          </li>
        </ul>
      </section>

      <section className="space">
        <div className="border-2 border-primary border-b-0 p-8">
          <h2 className="!mt-0">Často kladené otázky (FAQ)</h2>
          <p>
            Nižšie nájdete odpovede na najčastejšie otázky týkajúce sa online
            objednávania, platieb a doručenia v Box66.
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border-2 border-primary border-b-1">
          <Accordion type="single" collapsible className="w-full">
            {FAQ_ITEMS.map((item, index) => (
              <AccordionItem
                key={item.question}
                value={`faq-${index}`}
                className="border-b-2 border-primary last:border-b"
              >
                <AccordionTrigger className="hover:no-underline py-6 px-8">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="px-8 mb-4">{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </LegalPageShell>
  );
}
