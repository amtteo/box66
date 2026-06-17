# Box66 — Roadmap (batožina medzi kolami)

Tento súbor je „batožina" — v novom chate ho stačí otvoriť a spustiť ďalšie kolo.
Staviame postupne, každé kolo nadväzuje na predošlé.

## Stav

- [x] **Kolo 1 — Základy & dátový model**
  - Next.js 16 (App Router, `proxy.ts`), Tailwind v4
  - shadcn/ui (zinc) + základná sada komponentov
  - Prisma 7 (driver adapter `@prisma/adapter-pg`, `prisma.config.ts`)
  - Supabase klienti (`browser`, `server`) + refresh session v `proxy.ts`
  - Kompletná schéma domény (16 tabuliek) nasadená do Supabase, **RLS zapnuté**
  - Iniciálna migrácia `prisma/migrations/20260615120000_init`
  - Úvodná stránka s prehľadom modulov

- [x] **Kolo 2 — Auth & role (RBAC) & tenancy**
  - Prihlásenie / registrácia cez Supabase Auth (email + heslo), Server Actions + `useActionState`
  - Trigger `on_auth_user_created` (`auth.users` → `profiles`) + FK `profiles.id → auth.users(id)` ON DELETE CASCADE
  - `app_metadata` claims (`is_superadmin`, `org_roles`) cez service-role klient (`syncUserClaims`) — NIE `user_metadata`
  - Ochrana routes: optimistická v `proxy.ts` (redirect `/admin` ↔ `/prihlasenie`), autoritatívna v DAL (`src/lib/auth/dal.ts`)
  - Helpery `requireUser`, `requireProfile`, `requireRole`, `hasRole`; výber org/predajne (`getActiveContext`, `setActiveContext`)
  - Admin shell layout so sidebarom (org switcher + user menu) a dashboard kostra (`/admin`)
  - RLS politiky pre Data API: `profiles`, `memberships`, `organizations`, `stores` (privátne `SECURITY DEFINER` helpery v schéme `private`)

- [x] **Kolo 3 — Globálny katalóg (superadmin)**
  - CRUD: Kategórie, Produkty (alergény EÚ 14, kcal, čas prípravy, cena návrh, slug, poradie, aktívnosť)
  - CRUD: Globálne ingrediencie (`organizationId = null`) s mernými jednotkami (`UnitOfMeasure`)
  - Upload obrázkov do Supabase Storage (bucket `catalog`, public read, zápis cez service-role)
  - Server Actions + `useActionState` + Zod (`src/lib/catalog/*`), čítanie cez Prisma server-side
  - Routes `/admin/katalog/{kategorie,produkty,ingrediencie}` (len superadmin cez `requireRole`)

- [x] **Kolo 4 — Predajňa: menu & sklad (+ provisioning org/predajne/tím)**
  - Provisioning: Organizácie (superadmin CRUD + priradenie ADMINa cez e-mail),
    Predajne (ADMIN CRUD v aktívnej org), Tím a role (ADMIN pozýva MANAGER/STAFF
    do predajne; `syncUserClaims` po každej zmene členstva)
  - Prepínač predajní v sidebare (`setActiveStore`, cookie `box66_active_store`);
    sidebar zoskupený podľa rolí (Prevádzka / Franšíza / Platforma)
  - MenuItem: zapnutie globálnych produktov do menu predajne + ceny/dostupnosť (ADMIN+MANAGER)
  - Sklad: stavy `InventoryItem` + kniha `StockMovement`; pohyb (príjem/korekcia/odpis)
    transakčne prepočíta stav (MANAGER), hladina doobjednania, upozornenie „doobjednať";
    príjem len od **schválených dodávateľov** predajne (`StoreSupplier` M:N)
  - **Globálny katalóg (superadmin)**: receptúry (`Recipe` 1:1 produkt, `RecipeItem`),
    dodávatelia (`Supplier`), priradenie predajní (`StoreSupplier`),
    cenníky `SupplierIngredient` = **predajňa + dodávateľ + ingrediencia**
  - Franšízant (ADMIN) **nesmie** upravovať receptúry, ingrediencie ani dodávateľov —
    len predajne, tím, menu a sklad
  - Migrácia `20260615180000_global_catalog_suppliers` (globálne Recipe/Ingredient/Supplier,
    `StoreSupplier`, `SupplierIngredient.storeId`)

- [x] **Kolo 5 + 6 — Objednávky, odpočet skladu & platby Stripe** (zlúčené)
  - Úvodná stránka = storefront: menu predajne (zoskupené podľa kategórií) +
    košík vo **fullscreen bočnom paneli (Sheet)**, žiadne podstránky
  - Košík v `localStorage` (client state), ceny sa prepočítavajú **na serveri**
    z `MenuItem` (klientovi sa nedôveruje); objednávať môže hosť aj prihlásený
    (prihlásený → naviaže sa `customerId`)
  - Checkout: spôsob odberu (so sebou / na mieste) + platba **online kartou
    (Stripe Embedded Checkout)** alebo **v hotovosti pri prevzatí**
  - Stripe: Embedded Checkout session (Server Action, `ui_mode: embedded_page`,
    `redirect_on_completion: never`), `finalizeCheckout` overí platbu po dokončení;
    webhook `app/api/stripe/webhook` (raw body + overenie podpisu, idempotentný)
    je autoritatívny → `paymentStatus`, `stripePaymentIntentId`
  - Admin **Objednávky** (`/admin/objednavky`, STAFF+): zoznam + životný cyklus
    (PENDING → CONFIRMED → PREPARING → READY → COMPLETED; CANCELLED/REFUNDED)
  - **Odpočet skladu z receptúry až pri potvrdení** (PENDING→CONFIRMED), transakčne
    (`SALE_OUT`, s prevodom merných jednotiek g/kg, ml/l); pri zrušení/refundácii
    už odpočítaného skladu sa zásoby **vrátia späť**; refund online platby cez Stripe
  - Predvolená verejná predajňa = prvá aktívna v DB; kód je **store-aware**
    (pripravený na výber z viacerých predajní)

- [x] **Kolo 7 — Prezentačné stránky**
  - Route group `(site)` so zdieľaným layoutom: hlavička (`SiteHeader`) + päta
    (`SiteFooter`); rovnaká hlavička aj na storefronte (`/`) pre konzistentnú navigáciu
  - Verejné menu à la McDonald's `/menu` — produkty zoskupené **podľa kategórií**,
    sticky lišta kategórií (kotvy), karty produktov (cena z `MenuItem`, ťahané z DB)
  - Detail produktu `/menu/[slug]` — veľký obrázok, popis, **zloženie (prísady
    z globálnej receptúry, bez množstiev)**, alergény (plné EÚ popisky), kcal, čas
    prípravy, CTA „Objednať" → storefront, súvisiace položky z rovnakej kategórie
  - Informačné stránky `/o-nas` a `/kontakt` (adresa, telefón, e-mail, otváracie
    hodiny ak sú v DB, odkaz na Google Maps)
  - Dáta: `src/lib/menu/presentation.ts` (`getPresentationMenu`,
    `getPresentationProduct`, `getStoreContact`) — server-only, store-aware
    (predvolená predajňa cez `getDefaultStore`)

- [ ] **Kolo 8 — Reporting, polish, deploy**
  - Dashboardy (tržby, najpredávanejšie), nasadenie (Vercel + Supabase)

## Ako spustiť ďalšie kolo

V novom chate napíš napr.: **„Pokračujeme Kolom 7 podľa ROADMAP.md"**.

## Kľúčové rozhodnutia / poznámky

- Supabase projekt: **box66** (`ukthmfnkczuxutywyofl`, región eu-west-1, PG 17).
- ORM = Prisma; runtime ide cez pooled `DATABASE_URL` (6543, `pgbouncer=true`),
  migrácie cez `DIRECT_URL` (5432) v `prisma.config.ts`.
- `proxy.ts` (Next 16) nahrádza `middleware.ts`. Žije v `src/` (používame `src/`).
- Supabase Auth: výhradne `@supabase/ssr`, len `getAll`/`setAll`, publishable key.
- Autorizačné dáta vždy do `app_metadata` (NIE `user_metadata`).
- RLS zapnuté na všetkých tabuľkách; dáta čítame cez Prisma server-side.
- **DB heslo** treba doplniť do `.env` a spustiť `prisma migrate resolve --applied 20260615120000_init`.
- Supabase-špecifické DB objekty (auth trigger, RLS politiky) sú mimo Prismy —
  žijú ako Supabase migrácie (`supabase/migrations/*.sql`, nasadené cez MCP `apply_migration`).
- Autorizačné claims patria do `app_metadata` cez `SUPABASE_SECRET_KEY`; `handle_new_user`
  má odobraný `EXECUTE` pre `anon`/`authenticated` (spúšťa ju len trigger).
- DAL je jediný zdroj pravdy pre autorizáciu; proxy robí len optimistický redirect.
- Supabase Storage: bucket `catalog` (public read) na obrázky kategórií/produktov;
  zápis/mazanie výhradne cez service-role klient v Server Actions (obchádza RLS).
  Bucket je nasadený migráciou `supabase/migrations/20260615133220_kolo3_storage_catalog_bucket.sql`.
- `next.config.ts` má `images.remotePatterns` pre Supabase Storage host (`next/image`).
- Kolo 3: ingrediencie, produkty, kategórie, receptúry a dodávatelia sú **globálne**
  (`requireRole(Role.SUPERADMIN)`); franšízanti ich len zdedia.
- Tenancy helpery: `src/lib/auth/tenancy.ts` (`requireActiveOrg`, `requireActiveStore`,
  `authorizeOrg`, `authorizeStore`, `hasOrgRole`, `hasStoreRole`, `getAccessibleStores`,
  `getActiveStore`). ADMIN má org-úroveň členstvo (`storeId = null`) a vidí všetky
  predajne org; MANAGER/STAFF sú viazaní na konkrétnu predajňu.
- Aktívna predajňa: cookie `box66_active_store` (akcia `setActiveStore`), validovaná
  voči prístupným predajniam aktívnej org; prepínač org resetuje výber predajne.
- Rozdelenie právomocí: Menu = ADMIN+MANAGER predajne; Pohyb skladu = MANAGER+;
  Predajne/Tím = ADMIN; Katalóg (receptúry, dodávatelia, cenníky) = superadmin;
  Organizácie = superadmin. Odpočet skladu z receptúry = Kolo 5.
- Zdieľané `FormState` + pomocníci v `src/lib/forms.ts`; `DeleteButton` je generický.
- Pohyb skladu je transakčný (`prisma.$transaction`): zapíše `StockMovement` (znamienko
  podľa typu) a upsertne `InventoryItem.quantity`; pri úbytku pod 0 vráti chybu.
- Kolo 5+6 (objednávky): logika v `src/lib/orders/*` — `schemas.ts` (Zod + labely +
  `ORDER_STATUS_FLOW`), `queries.ts` (`getDefaultStore`, `getPublicMenu`, `getStoreOrders`),
  `stock.ts` (odpočet/vrátenie skladu + prevod jednotiek), `actions.ts` (`placeOrder`,
  `finalizeCheckout`, `getOrderStatus`, `updateOrderStatus`). Storefront UI v
  `src/components/storefront/*` (CartProvider/localStorage, MenuBoard, fullscreen CartSheet,
  Stripe Embedded), admin v `src/components/admin/orders/orders-board.tsx`.
- Stripe: server klient `src/lib/stripe/server.ts` (lazy, `isStripeConfigured`); doplň
  `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` do `.env`.
  Bez kľúčov funguje len platba v hotovosti; online karta sa skryje. Webhook URL:
  `/api/stripe/webhook` (lokálne `stripe listen --forward-to localhost:3000/api/stripe/webhook`).
- `orderNumber` je poradové **per predajňa** (max+1 v transakcii, retry pri kolízii);
  unikát `@@unique([storeId, orderNumber])`.
- Odpočet skladu sa robí **až pri potvrdení** objednávky (PENDING→CONFIRMED), nie pri
  vytvorení; platba (Stripe/hotovosť) je od stavu objednávky oddelená.
- Kolo 7 (prezentácia): verejné stránky žijú v route group `src/app/(site)/*`
  (`menu`, `menu/[slug]`, `o-nas`, `kontakt`) so zdieľaným `(site)/layout.tsx`
  (`SiteHeader` + `SiteFooter`). Storefront `/` ostáva (objednávanie) a používa
  rovnakú `SiteHeader`. Komponenty v `src/components/site/*`. Menu sa zoskupuje
  podľa kategórií, zloženie = názvy ingrediencií z **globálnej receptúry** (len ak je
  `Recipe.isActive`, bez množstiev). Stránky sú dynamické (`ƒ`), čítajú z DB cez Prisma.
