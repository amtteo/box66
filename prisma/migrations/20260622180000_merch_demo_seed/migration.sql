-- Vzorový MERCH: Black Tee s výberom veľkosti cez pool kategóriu.
-- Idempotentné podľa slug / unikátnych kľúčov.

-- Kategórie
INSERT INTO "categories" (
  "id", "name", "slug", "description", "sortOrder", "isActive",
  "isChoicePool", "showInStorefront", "createdAt", "updatedAt"
) VALUES
  (
    'a0000001-0001-4001-8001-000000000001',
    'MERCH (demo)',
    'merch-demo',
    'Vzorová kategória pre vernostný merch — nie na priamy predaj.',
    900,
    true,
    false,
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'a0000001-0002-4001-8001-000000000002',
    'Veľkosti — Black Tee (pool)',
    'merch-velkosti-black-tee',
    'Skrytý pool veľkostí pre demo tričko.',
    901,
    true,
    true,
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
ON CONFLICT ("slug") DO NOTHING;

-- Ingrediencie (sklad po kusoch)
INSERT INTO "ingredients" (
  "id", "name", "unit", "isActive", "createdAt", "updatedAt"
) VALUES
  ('a0000003-0011-4001-8001-000000000011', 'Tričko Black Tee S', 'PCS', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('a0000003-0012-4001-8001-000000000012', 'Tričko Black Tee M', 'PCS', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('a0000003-0013-4001-8001-000000000013', 'Tričko Black Tee L', 'PCS', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('a0000003-0014-4001-8001-000000000014', 'Tričko Black Tee XL', 'PCS', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;

-- Produkty
INSERT INTO "products" (
  "id", "categoryId", "name", "slug", "description", "sortOrder",
  "isActive", "isComboOption", "allergens", "createdAt", "updatedAt"
)
SELECT
  v.id::uuid,
  c.id,
  v.name,
  v.slug,
  v.description,
  v.sort_order,
  true,
  v.is_combo_option,
  '{}',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM (VALUES
  ('a0000002-0001-4001-8001-000000000010', 'merch-demo', 'Black Tee (demo)', 'black-tee-demo', 'Vzorové tričko — odmena s výberom veľkosti.', 1, false),
  ('a0000002-0011-4001-8001-000000000011', 'merch-velkosti-black-tee', 'Black Tee — S', 'black-tee-demo-s', 'Veľkosť S', 1, true),
  ('a0000002-0012-4001-8001-000000000012', 'merch-velkosti-black-tee', 'Black Tee — M', 'black-tee-demo-m', 'Veľkosť M', 2, true),
  ('a0000002-0013-4001-8001-000000000013', 'merch-velkosti-black-tee', 'Black Tee — L', 'black-tee-demo-l', 'Veľkosť L', 3, true),
  ('a0000002-0014-4001-8001-000000000014', 'merch-velkosti-black-tee', 'Black Tee — XL', 'black-tee-demo-xl', 'Veľkosť XL', 4, true)
) AS v(id, cat_slug, name, slug, description, sort_order, is_combo_option)
JOIN "categories" c ON c."slug" = v.cat_slug
ON CONFLICT ("slug") DO NOTHING;

-- Receptúry veľkostí (1 ks zo skladu)
INSERT INTO "recipes" ("id", "productId", "yield", "isActive", "createdAt", "updatedAt")
SELECT v.recipe_id::uuid, p.id, 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (VALUES
  ('a0000004-0011-4001-8001-000000000011', 'black-tee-demo-s'),
  ('a0000004-0012-4001-8001-000000000012', 'black-tee-demo-m'),
  ('a0000004-0013-4001-8001-000000000013', 'black-tee-demo-l'),
  ('a0000004-0014-4001-8001-000000000014', 'black-tee-demo-xl')
) AS v(recipe_id, product_slug)
JOIN "products" p ON p."slug" = v.product_slug
ON CONFLICT ("productId") DO NOTHING;

INSERT INTO "recipe_items" ("id", "recipeId", "ingredientId", "quantity", "unit")
SELECT gen_random_uuid(), r.id, i.id, 1, 'PCS'
FROM (VALUES
  ('black-tee-demo-s', 'Tričko Black Tee S'),
  ('black-tee-demo-m', 'Tričko Black Tee M'),
  ('black-tee-demo-l', 'Tričko Black Tee L'),
  ('black-tee-demo-xl', 'Tričko Black Tee XL')
) AS v(product_slug, ingredient_name)
JOIN "products" p ON p."slug" = v.product_slug
JOIN "recipes" r ON r."productId" = p.id
JOIN "ingredients" i ON i."name" = v.ingredient_name
ON CONFLICT ("recipeId", "ingredientId") DO NOTHING;

-- Skupina výberu na rodičovskom produkte
INSERT INTO "product_choice_groups" (
  "id", "productId", "categoryId", "label", "minSelect", "maxSelect", "sortOrder", "createdAt", "updatedAt"
)
SELECT
  'a0000005-0001-4001-8001-000000000001'::uuid,
  parent.id,
  pool.id,
  'Veľkosť',
  1,
  1,
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "products" parent
JOIN "categories" pool ON pool."slug" = 'merch-velkosti-black-tee'
WHERE parent."slug" = 'black-tee-demo'
ON CONFLICT ("id") DO NOTHING;

-- Vernostná odmena
INSERT INTO "loyalty_rewards" (
  "id", "productId", "pointsCost", "isActive", "sortOrder", "createdAt", "updatedAt"
)
SELECT
  'a0000006-0001-4001-8001-000000000001'::uuid,
  p.id,
  150,
  true,
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "products" p
WHERE p."slug" = 'black-tee-demo'
ON CONFLICT ("productId") DO NOTHING;

-- Položky menu v prvej aktívnej predajni
INSERT INTO "menu_items" ("id", "storeId", "productId", "isAvailable", "sortOrder", "createdAt", "updatedAt")
SELECT gen_random_uuid(), store.id, p.id, true, p."sortOrder", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "products" p
CROSS JOIN (
  SELECT "id" FROM "stores" WHERE "isActive" = true ORDER BY "createdAt" ASC LIMIT 1
) AS store
WHERE p."slug" IN (
  'black-tee-demo',
  'black-tee-demo-s',
  'black-tee-demo-m',
  'black-tee-demo-l',
  'black-tee-demo-xl'
)
ON CONFLICT ("storeId", "productId") DO NOTHING;

-- Počiatočný sklad veľkostí (10 ks) v prvej aktívnej predajni
INSERT INTO "inventory_items" ("id", "storeId", "ingredientId", "quantity", "unit", "createdAt", "updatedAt")
SELECT gen_random_uuid(), store.id, i.id, 10, 'PCS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "ingredients" i
CROSS JOIN (
  SELECT "id" FROM "stores" WHERE "isActive" = true ORDER BY "createdAt" ASC LIMIT 1
) AS store
WHERE i."name" IN (
  'Tričko Black Tee S',
  'Tričko Black Tee M',
  'Tričko Black Tee L',
  'Tričko Black Tee XL'
)
ON CONFLICT ("storeId", "ingredientId") DO UPDATE
SET "quantity" = GREATEST("inventory_items"."quantity", 10),
    "updatedAt" = CURRENT_TIMESTAMP;
