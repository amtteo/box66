-- Demo merch: položky menu (vrátane veľkostí) vo všetkých aktívnych predajniach.
INSERT INTO "menu_items" ("id", "storeId", "productId", "isAvailable", "sortOrder", "createdAt", "updatedAt")
SELECT gen_random_uuid(), s.id, p.id, true, p."sortOrder", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "stores" s
CROSS JOIN "products" p
WHERE s."isActive" = true
  AND p."slug" IN (
    'black-tee-demo',
    'black-tee-demo-s',
    'black-tee-demo-m',
    'black-tee-demo-l',
    'black-tee-demo-xl'
  )
ON CONFLICT ("storeId", "productId") DO UPDATE
SET "isAvailable" = true,
    "updatedAt" = CURRENT_TIMESTAMP;

-- Sklad veľkostí vo všetkých aktívnych predajniach.
INSERT INTO "inventory_items" ("id", "storeId", "ingredientId", "quantity", "unit", "createdAt", "updatedAt")
SELECT gen_random_uuid(), s.id, i.id, 10, 'PCS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "stores" s
CROSS JOIN "ingredients" i
WHERE s."isActive" = true
  AND i."name" IN (
    'Hranolky S',
    'Hranolky M',
    'Hranolky L',
    'Hranolky XL'
  )
ON CONFLICT ("storeId", "ingredientId") DO UPDATE
SET "quantity" = GREATEST("inventory_items"."quantity", 10),
    "updatedAt" = CURRENT_TIMESTAMP;
