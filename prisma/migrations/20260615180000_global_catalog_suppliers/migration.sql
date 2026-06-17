-- Kolo 4 fix: globálne receptúry/ingrediencie, dodávatelia M:N s predajňami,
-- cenník viazaný na predajňa + dodávateľ + ingrediencia.

-- 1) Odstráň org-špecifické ingrediencie (ostávajú len globálne)
DELETE FROM "ingredients" WHERE "organizationId" IS NOT NULL;

-- 2) Cenníky treba znovu zadať per predajňa (starý model nemal storeId)
DELETE FROM "supplier_ingredients";

-- 3) Receptúry: ponechaj jednu globálnu per produkt (najstaršiu), zvyšok zahoď
DELETE FROM "recipes" r1
USING "recipes" r2
WHERE r1."productId" = r2."productId" AND r1."createdAt" > r2."createdAt";

-- 4) Prepoj existujúcich dodávateľov na všetky predajne ich org (dočasná migrácia dát)
CREATE TABLE IF NOT EXISTS "store_suppliers" (
    "id" UUID NOT NULL,
    "storeId" UUID NOT NULL,
    "supplierId" UUID NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_suppliers_pkey" PRIMARY KEY ("id")
);

INSERT INTO "store_suppliers" ("id", "storeId", "supplierId", "isActive", "createdAt")
SELECT gen_random_uuid(), s."id", sup."id", true, NOW()
FROM "suppliers" sup
JOIN "stores" s ON s."organizationId" = sup."organizationId"
WHERE NOT EXISTS (
  SELECT 1 FROM "store_suppliers" ss
  WHERE ss."storeId" = s."id" AND ss."supplierId" = sup."id"
);

-- 5) ingredients: zruš org väzbu, globálne unikátne mená
ALTER TABLE "ingredients" DROP CONSTRAINT IF EXISTS "ingredients_organizationId_fkey";
DROP INDEX IF EXISTS "ingredients_organizationId_name_key";
DROP INDEX IF EXISTS "ingredients_organizationId_idx";
ALTER TABLE "ingredients" DROP COLUMN IF EXISTS "organizationId";
CREATE UNIQUE INDEX IF NOT EXISTS "ingredients_name_key" ON "ingredients"("name");

-- 6) recipes: globálne, jedna per produkt
ALTER TABLE "recipes" DROP CONSTRAINT IF EXISTS "recipes_organizationId_fkey";
DROP INDEX IF EXISTS "recipes_organizationId_productId_key";
DROP INDEX IF EXISTS "recipes_productId_idx";
ALTER TABLE "recipes" DROP COLUMN IF EXISTS "organizationId";
CREATE UNIQUE INDEX IF NOT EXISTS "recipes_productId_key" ON "recipes"("productId");

-- 7) suppliers: globálne bez org
ALTER TABLE "suppliers" DROP CONSTRAINT IF EXISTS "suppliers_organizationId_fkey";
DROP INDEX IF EXISTS "suppliers_organizationId_idx";
ALTER TABLE "suppliers" DROP COLUMN IF EXISTS "organizationId";

-- 8) supplier_ingredients: pridaj storeId (tabuľka je prázdna po kroku 2)
ALTER TABLE "supplier_ingredients" ADD COLUMN IF NOT EXISTS "storeId" UUID NOT NULL;
ALTER TABLE "supplier_ingredients" DROP CONSTRAINT IF EXISTS "supplier_ingredients_supplierId_ingredientId_key";
DROP INDEX IF EXISTS "supplier_ingredients_supplierId_ingredientId_key";
CREATE UNIQUE INDEX IF NOT EXISTS "supplier_ingredients_storeId_supplierId_ingredientId_key"
  ON "supplier_ingredients"("storeId", "supplierId", "ingredientId");
CREATE INDEX IF NOT EXISTS "supplier_ingredients_supplierId_idx" ON "supplier_ingredients"("supplierId");
CREATE INDEX IF NOT EXISTS "supplier_ingredients_ingredientId_idx" ON "supplier_ingredients"("ingredientId");

-- 9) FK pre nové väzby
CREATE UNIQUE INDEX IF NOT EXISTS "store_suppliers_storeId_supplierId_key" ON "store_suppliers"("storeId", "supplierId");
CREATE INDEX IF NOT EXISTS "store_suppliers_supplierId_idx" ON "store_suppliers"("supplierId");

ALTER TABLE "store_suppliers" DROP CONSTRAINT IF EXISTS "store_suppliers_storeId_fkey";
ALTER TABLE "store_suppliers" ADD CONSTRAINT "store_suppliers_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "store_suppliers" DROP CONSTRAINT IF EXISTS "store_suppliers_supplierId_fkey";
ALTER TABLE "store_suppliers" ADD CONSTRAINT "store_suppliers_supplierId_fkey"
  FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "supplier_ingredients" DROP CONSTRAINT IF EXISTS "supplier_ingredients_storeId_fkey";
ALTER TABLE "supplier_ingredients" ADD CONSTRAINT "supplier_ingredients_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
