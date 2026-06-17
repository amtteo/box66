# Box66 — franšízová platforma

Superplatforma pre správu fastfood franšízy (burgre). Centrálny katalóg
produktov spravuje superadmin, jednotliví franšízanti si spravujú svoje predajne
— objednávky, menu, sklad, receptúry a dodávateľov.

## Stack (najnovšie verzie)

| Vrstva | Technológia |
| --- | --- |
| Framework | **Next.js 16** (App Router, `proxy.ts` namiesto deprecated `middleware.ts`) |
| UI | **shadcn/ui** (base color **zinc**, style new-york) + **Tailwind CSS v4** |
| DB | **Supabase** (Postgres 17) |
| Auth | **Supabase Auth** cez `@supabase/ssr` (getAll/setAll, publishable key) |
| ORM | **Prisma 7** (generator `prisma-client`, driver adapter `@prisma/adapter-pg`) |
| Platby | **Stripe** (Kolo 6) |

## Architektúra dát

```
Organization (franšízant)
  └── Store (predajňa)
        ├── MenuItem      (zapnuté produkty + ceny)
        ├── InventoryItem (stav skladu)
        ├── StockMovement (príjem / odpočet / korekcie)
        └── Order → OrderItem

Globálny katalóg (superadmin):  Category → Product
Per franšízant:                 Recipe → RecipeItem, Supplier → SupplierIngredient, Ingredient
```

Tok: **Kategória → Produkt → Receptúra → Ingrediencia → Dodávateľ**, a pri
**Objednávke** → automatický **odpočet skladu** (cez receptúru) — implementujeme v Kole 5.

### Role (RBAC)

`SUPERADMIN` → `ADMIN` (franšízant) → `MANAGER` (prevádzkar) → `STAFF` → `CUSTOMER`.

### Bezpečnosť

- **RLS je zapnuté na všetkých 16 tabuľkách** v schéme `public`. Bez politík
  znamená deny-all pre Supabase Data API (anon/authenticated).
- Aplikačné dáta tečú cez **Prisma na serveri** (privilegovaná rola, obchádza RLS);
  autorizácia (role, tenancy) sa rieši v aplikačnej vrstve.
- `proxy.ts` robí len „optimistický" auth check + refresh session. Autoritatívne
  overenie patrí do Data Access Layer / Server Components.

## Prvé spustenie

1. **Doplň `.env`** (už obsahuje URL a publishable key projektu `box66`):
   - `SUPABASE_SECRET_KEY` — Dashboard → Project Settings → API keys (`sb_secret_...`)
   - `DATABASE_URL` a `DIRECT_URL` — Dashboard → **Connect**, nahraď `[YOUR-DB-PASSWORD]`
     heslom databázy a over presný host pooleru.

2. **Zosúlaď Prisma migrácie** (schéma je už v DB nasadená cez Supabase MCP, takže
   iba označíme iniciálnu migráciu ako aplikovanú — bez opätovného spúšťania):

   ```bash
   npx prisma migrate resolve --applied 20260615120000_init
   ```

3. **Dev server:**

   ```bash
   npm run dev
   ```

## Užitočné príkazy

```bash
npm run dev          # vývojový server
npm run db:generate  # vygeneruje Prisma client
npm run db:migrate   # nová migrácia (vyžaduje DIRECT_URL)
npm run db:studio    # Prisma Studio
```

> Schéma je zdroj pravdy v `prisma/schema.prisma`. Prisma client sa generuje do
> `src/generated/prisma` (gitignored). Po zmene schémy spusti `npm run db:generate`.

Plán ďalších krokov nájdeš v [`ROADMAP.md`](./ROADMAP.md).
