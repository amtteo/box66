import type { Metadata } from "next";
import Link from "next/link";

import { LegalPageShell } from "@/components/site/legal-page-shell";
import {
  formatLegalAddress,
  getLegalOperator,
  type LegalOperator,
} from "@/lib/legal/operator";

export const metadata: Metadata = {
  title: "Ochrana osobných údajov",
  description:
    "Informácie o spracúvaní osobných údajov v súlade s GDPR a zákonom č. 18/2018 Z. z.",
};

const UPDATED_AT = "19. júna 2025";

function OperatorDetails({ op }: { op: LegalOperator }) {
  const address = formatLegalAddress(op);

  return (
    <ul>
      <li>Obchodný názov: {op.tradeName}</li>
      <li>Prevádzkovateľ: {op.legalName}</li>
      {address && <li>Adresa: {address}</li>}
      {op.ico && <li>IČO: {op.ico}</li>}
      {op.email && (
        <li>
          Kontakt pre otázky o ochrane údajov:{" "}
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
    </ul>
  );
}

export default async function PrivacyPage() {
  const op = await getLegalOperator();

  return (
    <LegalPageShell
      eyebrow="Právne informácie"
      title="Ochrana osobných údajov (GDPR)"
      description="Informácie o spracúvaní osobných údajov podľa Nariadenia Európskeho parlamentu a Rady (EÚ) 2016/679 (GDPR) a zákona č. 18/2018 Z. z. o ochrane osobných údajov."
      updatedAt={UPDATED_AT}
    >
      <section>
        <h2>1. Prevádzkovateľ</h2>
        <p>
          Prevádzkovateľom osobných údajov spracúvaných prostredníctvom webovej
          stránky a online objednávkového systému Box66 je:
        </p>
        <OperatorDetails op={op} />
        {!op.ico && (
          <p className="text-muted-foreground">
            Aktuálne kontaktné údaje nájdete na stránke{" "}
            <Link href="/kontakt" className="text-primary hover:underline">
              Kontakt
            </Link>
            .
          </p>
        )}
      </section>

      <section>
        <h2>2. Účel a rozsah tohto dokumentu</h2>
        <p>
          Tento dokument vysvetľuje, aké osobné údaje spracúvame, prečo ich
          spracúvame, na akom právnom základe, ako dlho ich uchovávame, komu
          môžu byť sprístupnené a aké máte práva. Informácie poskytujeme v
          súlade s čl. 13 a 14 GDPR a § 19 zákona č. 18/2018 Z. z.
        </p>
      </section>

      <section>
        <h2>3. Kategórie spracúvaných údajov</h2>
        <p>V závislosti od spôsobu využívania služby môžeme spracúvať:</p>
        <ul>
          <li>
            <strong>Identifikačné a kontaktné údaje</strong> — meno, priezvisko,
            e-mail, telefónne číslo, adresa doručenia.
          </li>
          <li>
            <strong>Údaje o objednávke</strong> — obsah objednávky, spôsob
            doručenia, poznámky, história objednávok.
          </li>
          <li>
            <strong>Platobné údaje</strong> — informácie o platbe (suma, stav,
            identifikátor transakcie). Úplné údaje platobnej karty spracúva
            licencovaný poskytovateľ platobných služieb; prevádzkovateľ ich
            neukladá.
          </li>
          <li>
            <strong>Účtovné údaje</strong> — pri registrácii a prihlásení do
            zákazníckeho účtu (ak ho využívate).
          </li>
          <li>
            <strong>Technické údaje</strong> — IP adresa, typ prehliadača,
            cookies, údaje o zariadení a interakcii so stránkou.
          </li>
          <li>
            <strong>Komunikačné údaje</strong> — správy z kontaktného formulára
            alebo reklamácií.
          </li>
        </ul>
      </section>

      <section>
        <h2>4. Účely a právne základy spracúvania</h2>
        <div className="space-y-4">
          <div>
            <h3>Plnenie objednávky a zmluvy</h3>
            <p>
              Spracúvanie údajov nevyhnutných na prijatie, prípravu, doručenie
              alebo vyzdvihnutie objednávky a na vystavenie daňového dokladu.
              Právny základ: čl. 6 ods. 1 písm. b) GDPR (plnenie zmluvy).
            </p>
          </div>
          <div>
            <h3>Plnenie zákonných povinností</h3>
            <p>
              Archivácia účtovných a daňových dokladov, vybavovanie reklamácií
              a plnenie povinností voči orgánom verejnej moci. Právny základ:
              čl. 6 ods. 1 písm. c) GDPR.
            </p>
          </div>
          <div>
            <h3>Oprávnený záujem</h3>
            <p>
              Ochrana práv a majetku prevádzkovateľa, prevencia podvodov,
              zabezpečenie IT systémov, interné štatistiky a zlepšovanie služieb
              v anonymizovanej podobe. Právny základ: čl. 6 ods. 1 písm. f)
              GDPR. Proti tomuto spracúvaniu môžete podať námietku.
            </p>
          </div>
          <div>
            <h3>Súhlas</h3>
            <p>
              Marketingové e-maily, newsletter alebo analytické cookies, ak nie
              sú nevyhnutné — len na základe vášho výslovného súhlasu podľa čl.
              6 ods. 1 písm. a) GDPR. Súhlas môžete kedykoľvek odvolať bez
              vplyvu na zákonnosť spracúvania pred odvolaním.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2>5. Doba uchovávania údajov</h2>
        <ul>
          <li>
            Údaje o objednávkach a fakturácii — po dobu trvania zmluvného vzťahu
            a následne v lehote vyžadovanej účtovnými a daňovými predpismi
            (spravidla 10 rokov).
          </li>
          <li>
            Reklamačné spisy — po dobu vybavenia reklamácie a následne podľa
            zákonných lehôt premlčania.
          </li>
          <li>
            Marketingové súhlasy — do odvolania súhlasu, najviac 3 roky od
            poslednej interakcie, ak zákon neustanoví inak.
          </li>
          <li>
            Technické logy a bezpečnostné záznamy — spravidla do 12 mesiacov,
            pokiaľ nie je potrebné dlhšie uchovávanie pri vyšetrovaní incidentu.
          </li>
          <li>
            Cookies — podľa typu cookie, viac v sekcii Cookies nižšie.
          </li>
        </ul>
      </section>

      <section>
        <h2>6. Príjemcovia a sprostredkovatelia</h2>
        <p>
          Osobné údaje sprístupňujeme len v rozsahu nevyhnutnom na poskytovanie
          služby týmto kategóriám príjemcov:
        </p>
        <ul>
          <li>
            Poskytovatelia IT infraštruktúry a hostingu (Supabase, Vercel alebo
            obdobní partneri).
          </li>
          <li>
            Poskytovateľ platobných služieb Stripe (spracúvanie online platieb).
          </li>
          <li>
            Poskytovatelia mapových služieb Google Maps (overenie adresy
            doručenia, ak využívate donášku).
          </li>
          <li>
            Kurýrni partneri alebo zamestnanci prevádzky pri doručovaní
            objednávky.
          </li>
          <li>
            Účtovnícke, právne a audítorské služby v nevyhnutnom rozsahu.
          </li>
          <li>
            Orgány verejnej moci, ak to vyžaduje zákon.
          </li>
        </ul>
        <p>
          So sprostredkovateľmi máme uzavreté zmluvy o spracúvaní osobných
          údajov v súlade s čl. 28 GDPR. Niektorí partneri môžu spracúvať údaje
          aj mimo EÚ; v takom prípade zabezpečujeme primerané záruky (napr.
          štandardné zmluvné doložky EÚ).
        </p>
      </section>

      <section>
        <h2>7. Cookies a podobné technológie</h2>
        <p>
          Web používa cookies a podobné technológie na zabezpečenie funkčnosti
          stránky, zapamätanie voľby predajne, košíka a prihlásenia, prípadne na
          analytiku a marketing — ak sú na to získané súhlasy.
        </p>
        <ul>
          <li>
            <strong>Nevyhnutné cookies</strong> — umožňujú základnú funkčnosť
            (relácia, košík, bezpečnosť). Právny základ: oprávnený záujem /
            plnenie zmluvy.
          </li>
          <li>
            <strong>Analytické a marketingové cookies</strong> — len so súhlasom
            podľa zákona č. 452/2021 Z. z. o elektronických komunikáciách a
            ePrivacy pravidiel.
          </li>
        </ul>
        <p>
          Cookies môžete spravovať v nastaveniach prehliadača. Obmedzenie
          nevyhnutných cookies môže ovplyvniť funkčnosť objednávkového systému.
        </p>
      </section>

      <section>
        <h2>8. Bezpečnosť údajov</h2>
        <p>
          Prevádzkovateľ prijal primerané technické a organizačné opatrenia na
          ochranu osobných údajov pred stratou, zneužitím, neoprávneným prístupom
          alebo zverejnením, vrátane šifrovaného prenosu (HTTPS), riadenia
          prístupov, pravidelných aktualizácií systémov a zmluvných povinností
          u sprostredkovateľov.
        </p>
      </section>

      <section>
        <h2>9. Automatizované rozhodovanie a profilovanie</h2>
        <p>
          Pri bežnom objednávaní nevykonávame automatizované rozhodovanie s
          právnymi alebo obdobne významnými účinkami voči dotknutej osobe v
          zmysle čl. 22 GDPR. Overenie doručovacej zóny na základe adresy je
          technická kontrola dostupnosti služby, nie profilovanie zákazníka.
        </p>
      </section>

      <section>
        <h2>10. Vaše práva</h2>
        <p>Podľa GDPR a zákona č. 18/2018 Z. z. máte najmä tieto práva:</p>
        <ul>
          <li>právo na prístup k osobným údajom (čl. 15 GDPR),</li>
          <li>právo na opravu (čl. 16 GDPR),</li>
          <li>právo na vymazanie — „právo zabudnutia“ (čl. 17 GDPR),</li>
          <li>právo na obmedzenie spracúvania (čl. 18 GDPR),</li>
          <li>právo na prenosnosť údajov (čl. 20 GDPR),</li>
          <li>právo namietať proti spracúvaniu (čl. 21 GDPR),</li>
          <li>
            právo odvolať súhlas kedykoľvek, ak je spracúvanie založené na
            súhlase,
          </li>
          <li>
            právo podať sťažnosť dozornému orgánu.
          </li>
        </ul>
        <p>
          Žiadosti o uplatnenie práv zasielajte na{" "}
          {op.email ? (
            <a href={`mailto:${op.email}`} className="text-primary hover:underline">
              {op.email}
            </a>
          ) : (
            "kontaktný e-mail uvedený na stránke Kontakt"
          )}
          . Na overenie totožnosti môžeme požiadať o doplnenie informácií.
          Odpovieme bez zbytočného odkladu, najneskôr do jedného mesiaca.
        </p>
      </section>

      <section>
        <h2>11. Dozorný orgán</h2>
        <p>
          Dozorným orgánom na území Slovenskej republiky je Úrad na ochranu
          osobných údajov Slovenskej republiky (ÚOOÚ):
        </p>
        <ul>
          <li>Hraničná 12, 820 07 Bratislava 27</li>
          <li>
            Web:{" "}
            <a
              href="https://www.dataprotection.gov.sk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              www.dataprotection.gov.sk
            </a>
          </li>
          <li>E-mail: posta@pdp.gov.sk</li>
        </ul>
      </section>

      <section>
        <h2>12. Deti</h2>
        <p>
          Služby nie sú primárne určené deťom mladším ako 16 rokov. Vedome
          nezberáme osobné údaje detí bez súhlasu zákonného zástupcu. Ak sa
          dozviete, že dieťa nám poskytlo údaje bez súhlasu, kontaktujte nás —
          údaje vymažeme.
        </p>
      </section>

      <section>
        <h2>13. Zmeny zásad</h2>
        <p>
          Tieto zásady môžeme aktualizovať pri zmene právnych predpisov,
          technológií alebo rozsahu služieb. Aktuálne znenie je vždy zverejnené
          na tejto stránke s uvedením dátumu poslednej aktualizácie. Pri
          podstatných zmenách vás informujeme primeraným spôsobom (napr.
          bannerom na webe alebo e-mailom, ak máme vašu adresu).
        </p>
        <p>
          Súvisiace dokumenty:{" "}
          <Link href="/obchodne-podmienky" className="text-primary hover:underline">
            Obchodné podmienky
          </Link>
          .
        </p>
      </section>
    </LegalPageShell>
  );
}
