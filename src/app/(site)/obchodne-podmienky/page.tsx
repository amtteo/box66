import type { Metadata } from "next";
import Link from "next/link";

import { LegalPageShell, LEGAL_SECTION_BLOCK } from "@/components/site/legal-page-shell";
import {
  formatLegalAddress,
  getLegalOperator,
  type LegalOperator,
} from "@/lib/legal/operator";

export const metadata: Metadata = {
  title: "Obchodné podmienky",
  description:
    "Všeobecné obchodné podmienky online objednávok v prevádzke Box66 fast food.",
};

const UPDATED_AT = "19. júna 2025";

function OperatorDetails({ op }: { op: LegalOperator }) {
  const address = formatLegalAddress(op);

  return (
    <ul>
      <li>Obchodný názov: {op.tradeName}</li>
      <li>Obchodník: {op.legalName}</li>
      {op.storeName && <li>Prevádzka: {op.storeName}</li>}
      {address && <li>Sídlo / prevádzka: {address}</li>}
      {op.ico && <li>IČO: {op.ico}</li>}
      {op.dic && <li>DIČ: {op.dic}</li>}
      {op.icDph && <li>IČ DPH: {op.icDph}</li>}
      {op.email && (
        <li>
          E-mail:{" "}
          <a href={`mailto:${op.email}`} className="text-primary hover:underline">
            {op.email}
          </a>
        </li>
      )}
      {op.phone && (
        <li>
          Telefón:{" "}
          <a href={`tel:${op.phone}`} className="text-primary hover:underline">
            {op.phone}
          </a>
        </li>
      )}
      <li>
        Web:{" "}
        <Link href="/" className="text-primary hover:underline">
          www.box66.sk
        </Link>
      </li>
    </ul>
  );
}

export default async function TermsPage() {
  const op = await getLegalOperator();

  return (
    <LegalPageShell
      title="Všeobecné obchodné podmienky"
      description="Podmienky online objednávok hotových jedál a nápojov v prevádzke Box66. Platné pre zmluvy uzavreté na diaľku podľa zákona č. 108/2024 Z. z. o ochrane spotrebiteľa."
      updatedAt={UPDATED_AT}
    >
      <section className={LEGAL_SECTION_BLOCK}>
        <h2>1. Úvodné ustanovenia</h2>
        <p>
          Tieto všeobecné obchodné podmienky (ďalej len „VOP“) upravujú práva a
          povinnosti medzi obchodníkom a spotrebiteľom pri objednávaní a
          poskytovaní hotových jedál a nápojov (ďalej len „produkty“) prostredníctvom
          webovej stránky Box66 (ďalej len „online rozhranie“).
        </p>
        <p>
          VOP sú neoddeliteľnou súčasťou každej spotrebiteľskej zmluvy
          uzavretej na diaľku. Odoslaním objednávky spotrebiteľ potvrdzuje, že sa
          s VOP oboznámil a súhlasí s nimi.
        </p>
      </section>

      <section className={LEGAL_SECTION_BLOCK}>
        <h2>2. Identifikačné údaje obchodníka</h2>
        <p>
          Obchodníkom v zmysle zákona č. 108/2024 Z. z. o ochrane spotrebiteľa
          a zákona č. 22/2004 Z. z. o elektronickom obchode je:
        </p>
        <OperatorDetails op={op} />
        {!op.ico && (
          <p className="text-muted-foreground">
            Úplné identifikačné údaje nájdete aj na stránke{" "}
            <Link href="/kontakt" className="text-primary hover:underline">
              Kontakt
            </Link>
            .
          </p>
        )}
      </section>

      <section className={LEGAL_SECTION_BLOCK}>
        <h2>3. Definície</h2>
        <ul>
          <li>
            <strong>Spotrebiteľ</strong> — fyzická osoba, ktorá pri objednávaní
            nekoná v rámci podnikateľskej činnosti.
          </li>
          <li>
            <strong>Produkt</strong> — hotové jedlo, nápoj alebo iná položka z
            aktuálneho menu zverejneného v online rozhraní.
          </li>
          <li>
            <strong>Objednávka</strong> — záväzný návrh spotrebiteľa na
            uzavretie zmluvy odoslaný prostredníctvom online rozhrania.
          </li>
          <li>
            <strong>Cena</strong> — konečná cena produktu vrátane DPH a
            prípadných poplatkov za donášku, ak sú v objednávke uvedené.
          </li>
        </ul>
      </section>

      <section className={LEGAL_SECTION_BLOCK}>
        <h2>4. Informácie o produktoch</h2>
        <p>
          Pred odoslaním objednávky obchodník zverejní v online rozhraní
          informácie o produktoch vrátane názvu, popisu, zloženia, alergénov,
          energetickej hodnoty (ak je dostupná), predajnej ceny vrátane DPH a
          dostupnosti. Ceny sú uvedené v mene prevádzky (EUR), pokiaľ nie je
          uvedené inak.
        </p>
        <p>
          Obchodník si vyhradzuje právo meniť ponuku, ceny a dostupnosť
          produktov. Zmena sa nevzťahuje na už potvrdené objednávky.
        </p>
      </section>

      <section className={LEGAL_SECTION_BLOCK}>
        <h2>5. Objednávkový proces</h2>
        <ol>
          <li>
            Spotrebiteľ vyberie produkty, spôsob doručenia alebo vyzdvihnutia,
            prípadne ďalšie možnosti ponuky, a vyplní požadované údaje.
          </li>
          <li>
            Pred odoslaním objednávky môže spotrebiteľ skontrolovať a opraviť
            zadané údaje.
          </li>
          <li>
            Spotrebiteľ je povinný pred odoslaním objednávky výslovne potvrdiť,
            že bol oboznámený s povinnosťou zaplatiť cenu, a že súhlasí s týmito
            VOP. Tlačidlo na odoslanie objednávky je označené ako „Objednávka s
            povinnosťou platby“ alebo ekvivalentnou jednoznačnou formuláciou v
            súlade so zákonom č. 108/2024 Z. z.
          </li>
          <li>
            Odoslaním objednávky spotrebiteľ podáva návrh na uzavretie zmluvy.
            Zmluva vzniká potvrdením objednávky obchodníkom (e-mailom, SMS,
            notifikáciou v aplikácii alebo pripravením objednávky na prevzatie).
          </li>
        </ol>
        <p>
          Spotrebiteľ je povinný uvádzať pravdivé, úplné a aktuálne údaje.
          Obchodník môže objednávku odmietnuť alebo zrušiť pri podozrení na
          zneužitie, chybné údaje alebo nedostupnosť produktov.
        </p>
      </section>

      <section className={LEGAL_SECTION_BLOCK}>
        <h2>6. Ceny a platobné podmienky</h2>
        <p>
          Celková cena objednávky zahŕňa cenu produktov, prípadný poplatok za
          donášku a ďalšie poplatky, ak boli spotrebiteľovi pred odoslaním
          objednávky jasne oznámené a spotrebiteľ s nimi výslovne súhlasil.
        </p>
        <p>
          Platbu je možné uskutočniť spôsobmi ponúkanými v online rozhraní (napr.
          platobnou kartou online, pri prevzatí hotovosťou alebo kartou).
          Pri platbe kartou online spracúva platbu licencovaný poskytovateľ
          platobných služieb (Stripe). Obchodník neukladá úplné údaje platobnej
          karty.
        </p>
        <p>
          Daňový doklad vystaví obchodník v súlade so zákonom o dani z pridanej
          hodnoty a poskytne ho spotrebiteľovi spôsobom primeraným spôsobu
          objednávky (elektronicky alebo pri prevzatí).
        </p>
      </section>

      <section className={LEGAL_SECTION_BLOCK}>
        <h2>7. Dodanie, vyzdvihnutie a lehoty plnenia</h2>
        <p>
          Spotrebiteľ si zvolí spôsob plnenia — donášku na adresu alebo
          osobné vyzdvihnutie v prevádzke. Odhadovaný čas doručenia alebo
          prípravy je orientačný a môže sa meniť v závislosti od vyťaženia
          prevádzky, dopravných podmienok alebo force majeure.
        </p>
        <p>
          Pri donáške je spotrebiteľ povinný zabezpečiť dostupnosť na uvedenej
          adrese a prijať objednávku. Ak doručenie z dôvodu na strane
          spotrebiteľa zlyhá, obchodník môže účtovať cenu objednávky a
          prípadný poplatok za opakované doručenie.
        </p>
      </section>

      <section className={LEGAL_SECTION_BLOCK}>
        <h2>8. Právo spotrebiteľa odstúpiť od zmluvy</h2>
        <p>
          V súlade s § 19 zákona č. 108/2024 Z. z. a smernicou Európskeho
          parlamentu a Rady 2011/83/EÚ spotrebiteľ nemá právo odstúpiť od zmluvy
          o dodaní tovaru, ktorý podlieha rýchlej skaze alebo po uplynutí doby
          spotreby, ani od zmluvy o dodaní tovaru vyrobeného podľa
          špecifikácií spotrebiteľa alebo prispôsobeného jeho osobným potrebám.
        </p>
        <p>
          Hotové jedlá a nápoje pripravované na základe objednávky spotrebiteľa
          spadajú do týchto výnimiek. Po potvrdení a začatí prípravy objednávky
          preto nie je možné od zmluvy bezplatne odstúpiť, pokiaľ sa strany
          nedohodnú inak.
        </p>
      </section>

      <section className={LEGAL_SECTION_BLOCK}>
        <h2>9. Reklamácie a zodpovednosť za vady</h2>
        <p>
          Spotrebiteľ má právo uplatniť zodpovednosť za vady produktu v súlade
          so zákonom č. 108/2024 Z. z. a Občianskym zákonníkom. Reklamáciu je
          možné uplatniť bez zbytočného odkladu po prevzatí objednávky, ideálne
          ihneď pri doručení alebo v prevádzke.
        </p>
        <p>Reklamáciu môžete podať:</p>
        <ul>
          {op.email && (
            <li>
              e-mailom na{" "}
              <a href={`mailto:${op.email}`} className="text-primary hover:underline">
                {op.email}
              </a>
            </li>
          )}
          {op.phone && (
            <li>
              telefonicky na{" "}
              <a href={`tel:${op.phone}`} className="text-primary hover:underline">
                {op.phone}
              </a>
            </li>
          )}
          <li>
            osobne v prevádzke — viac na{" "}
            <Link href="/kontakt" className="text-primary hover:underline">
              stránke Kontakt
            </Link>
          </li>
        </ul>
        <p>
          Obchodník vybaví reklamáciu bez zbytočného odkladu, najneskôr do 30
          dní odo dňa uplatnenia. Pri oprávnenej reklamácii môže spotrebiteľ
          požadovať najmä bezplatnú opravu (opätovné dodanie), zľavu z ceny
          alebo odstúpenie od zmluvy, ak je to primerané povahe vady.
        </p>
      </section>

      <section className={LEGAL_SECTION_BLOCK}>
        <h2>10. Alergény a informácie o potravinách</h2>
        <p>
          Informácie o alergénoch a zložení produktov sú uvedené pri jednotlivých
          položkách menu. Spotrebiteľ je povinný skontrolovať tieto informácie
          pred objednaním. V prípade potravinovej intolerancie alebo alergie
          uveďte požiadavku v poznámke k objednávke alebo kontaktujte prevádzku.
        </p>
        <p>
          Obchodník vynakladá primerané úsilie na prevenciu skríženého
          znečistenia, avšak pri príprave hotových jedál v prevádzke fast food
          nemôže vylúčiť stopové množstvá alergénov.
        </p>
      </section>

      <section className={LEGAL_SECTION_BLOCK}>
        <h2>11. Ochrana osobných údajov</h2>
        <p>
          Spracúvanie osobných údajov pri objednávaní sa riadi{" "}
          <Link
            href="/ochrana-osobnych-udajov"
            className="text-primary hover:underline"
          >
            Zásadami ochrany osobných údajov (GDPR)
          </Link>
          . Odoslaním objednávky spotrebiteľ potvrdzuje oboznámenie s týmito
          zásadami v rozsahu nevyhnutnom na plnenie objednávky.
        </p>
      </section>

      <section className={LEGAL_SECTION_BLOCK}>
        <h2>12. Mimosúdne riešenie sporov</h2>
        <p>
          Spotrebiteľ má právo obrátiť sa na obchodníka so žiadostí o nápravu.
          Ak spotrebiteľ nie je spokojný s vybavením reklamácie alebo odpoveďou
          obchodníka, môže podať podnet orgánu dohľadu alebo využiť platformu
          pre riešenie sporov online (RSO) na{" "}
          <a
            href="https://ec.europa.eu/consumers/odr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            ec.europa.eu/consumers/odr
          </a>
          .
        </p>
        <p>
          Orgánom dozoru v oblasti ochrany spotrebiteľa je Slovenská obchodná
          inšpekcia (
          <a
            href="https://www.soi.sk"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            www.soi.sk
          </a>
          ).
        </p>
      </section>

      <section className={LEGAL_SECTION_BLOCK}>
        <h2>13. Záverečné ustanovenia</h2>
        <p>
          Tieto VOP sa riadia právnym poriadkom Slovenskej republiky. Ak je
          niektoré ustanovenie neplatné, ostatné ustanovenia zostávajú v platnosti.
        </p>
        <p>
          Obchodník je oprávnený VOP aktualizovať. Zmena nadobudne účinnosť
          zverejnením v online rozhraní; na už uzavreté zmluvy sa vzťahuje
          znenie platné v čase odoslania objednávky.
        </p>
      </section>
    </LegalPageShell>
  );
}
