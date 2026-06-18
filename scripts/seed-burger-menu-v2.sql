-- =============================================================================
-- Box66 — Burger Menu v2 (PDF)
-- =============================================================================
-- Mapovanie existujúcich ingrediencií:
--   Žemľa            → Hladká žemľa
--   Cheddar          → Cheddar (premenovaný z Tavený syr)
--   Nakladaná uhorka → Kyslá uhorka
--   Hovädzí patty    → Hovädzia placka
-- Cheeseburger sa nevkladá — existuje ako Cheesy Burger (slug: cheese66).
-- =============================================================================

BEGIN;

-- ── 0. Tavený syr → Cheddar ──────────────────────────────────────────────────

UPDATE ingredients
SET name = 'Cheddar', "updatedAt" = NOW()
WHERE name = 'Tavený syr';

-- ── 1. Nové ingrediencie ─────────────────────────────────────────────────────

INSERT INTO ingredients (id, name, unit, "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid(), x.name, x.unit::"UnitOfMeasure", true, NOW(), NOW()
FROM (VALUES
  ('Žemľa s prostredným dielom', 'PCS'),
  ('Box66 omáčka',             'G'),
  ('Ľadový šalát',             'G'),
  ('BBQ omáčka',               'G'),
  ('Slanina',                  'G'),
  ('Chrumkavá cibuľka',        'G'),
  ('Spicy mayo',               'G'),
  ('Jalapeños',                'G'),
  ('Čerstvé paradajky',        'G'),
  ('Brioche žemľa',            'PCS')
) AS x(name, unit)
WHERE NOT EXISTS (SELECT 1 FROM ingredients i WHERE i.name = x.name);

-- ── 2. Produkty (kategória Burgers) ──────────────────────────────────────────

WITH cat AS (
  SELECT id FROM categories WHERE slug = 'burgers' LIMIT 1
)
INSERT INTO products (
  id, "categoryId", name, slug, description,
  "suggestedPrice", sku, allergens, kcal,
  "sortOrder", "isActive", "isComboOption", "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid(),
  cat.id,
  p.name,
  p.slug,
  NULL,
  NULL,
  p.sku,
  p.allergens,
  p.kcal,
  p.sort_order,
  true,
  false,
  NOW(),
  NOW()
FROM cat
CROSS JOIN (VALUES
  ('Hamburger',     'hamburger',     'BUR-HAMB',  ARRAY['gluten','mustard']::text[],              310, 0),
  ('Double Cheese', 'double-cheese', 'BUR-DBCH',  ARRAY['gluten','milk','mustard']::text[],        485, 2),
  ('MAJESTIC',      'majestic',      'BUR-MAJS',  ARRAY['gluten','milk','eggs','mustard']::text[], 560, 3),
  ('BBQ Bacon',     'bbq-bacon',     'BUR-BBQB',  ARRAY['gluten','milk','soy']::text[],           590, 4),
  ('Spicy',         'spicy',         'BUR-SPICY', ARRAY['gluten','milk','eggs','mustard']::text[], 555, 5),
  ('LEGEND',        'legend',        'BUR-LEGD',  ARRAY['gluten','eggs','sesame','mustard']::text[], 660, 6),
  ('SMOKY',         'smoky',         'BUR-SMOK',  ARRAY['gluten','eggs','milk']::text[],          950, 7)
) AS p(name, slug, sku, allergens, kcal, sort_order);

-- ── 3. Receptúry ─────────────────────────────────────────────────────────────

INSERT INTO recipes (id, "productId", name, yield, instructions, "isActive", "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  p.id,
  p.name || ' — receptúra',
  1,
  NULL,
  true,
  NOW(),
  NOW()
FROM products p
WHERE p.slug IN (
  'hamburger', 'double-cheese', 'majestic',
  'bbq-bacon', 'spicy', 'legend', 'smoky'
)
AND NOT EXISTS (SELECT 1 FROM recipes r WHERE r."productId" = p.id);

-- ── 4. Položky receptúr ───────────────────────────────────────────────────────

INSERT INTO recipe_items (id, "recipeId", "ingredientId", quantity, unit, notes)
SELECT
  gen_random_uuid(),
  r.id,
  i.id,
  ri.quantity,
  ri.unit::"UnitOfMeasure",
  ri.notes
FROM (VALUES
  -- HAMBURGER
  ('hamburger',   'Hladká žemľa',              1,    'PCS', NULL),
  ('hamburger',   'Hovädzia placka',           50,   'G',   '1 × 50 g'),
  ('hamburger',   'Kečup',                     12,   'G',   NULL),
  ('hamburger',   'Horčica',                   6,    'G',   NULL),
  ('hamburger',   'Kyslá uhorka',              8,    'G',   '2 plátky'),
  ('hamburger',   'Cibuľa',                    10,   'G',   NULL),

  -- DOUBLE CHEESE
  ('double-cheese', 'Hladká žemľa',            1,    'PCS', NULL),
  ('double-cheese', 'Hovädzia placka',         100,  'G',   '2 × 50 g'),
  ('double-cheese', 'Cheddar',                 2,    'PCS', '2 plátky (40 g)'),
  ('double-cheese', 'Kečup',                   12,   'G',   NULL),
  ('double-cheese', 'Horčica',                 6,    'G',   NULL),
  ('double-cheese', 'Kyslá uhorka',            8,    'G',   '2 plátky'),
  ('double-cheese', 'Cibuľa',                  10,   'G',   NULL),

  -- MAJESTIC
  ('majestic', 'Žemľa s prostredným dielom',   1,    'PCS', NULL),
  ('majestic', 'Hovädzia placka',             100,  'G',   '2 × 50 g'),
  ('majestic', 'Cheddar',                     2,    'PCS', '2 plátky (40 g)'),
  ('majestic', 'Box66 omáčka',                20,   'G',   NULL),
  ('majestic', 'Ľadový šalát',                20,   'G',   NULL),
  ('majestic', 'Kyslá uhorka',                12,   'G',   '3 plátky'),
  ('majestic', 'Cibuľa',                      10,   'G',   NULL),

  -- BBQ BACON
  ('bbq-bacon', 'Hladká žemľa',               1,    'PCS', NULL),
  ('bbq-bacon', 'Hovädzia placka',            100,  'G',   '2 × 50 g'),
  ('bbq-bacon', 'Cheddar',                    2,    'PCS', '2 plátky (40 g)'),
  ('bbq-bacon', 'BBQ omáčka',                 18,   'G',   NULL),
  ('bbq-bacon', 'Slanina',                    18,   'G',   '2 plátky'),
  ('bbq-bacon', 'Chrumkavá cibuľka',          10,   'G',   NULL),

  -- SPICY
  ('spicy', 'Hladká žemľa',                   1,    'PCS', NULL),
  ('spicy', 'Hovädzia placka',                 100,  'G',   '2 × 50 g'),
  ('spicy', 'Cheddar',                           2,    'PCS', '2 plátky (40 g)'),
  ('spicy', 'Spicy mayo',                      18,   'G',   NULL),
  ('spicy', 'Jalapeños',                       12,   'G',   NULL),
  ('spicy', 'Kyslá uhorka',                    8,    'G',   '2 plátky'),

  -- LEGEND
  ('legend', 'Sezamová žemľa',                 1,    'PCS', 'vrchný a spodný diel, opečená dosucha'),
  ('legend', 'Hovädzia placka',                113,  'G',   '100% beef, surová váha'),
  ('legend', 'Majonéza',                       21,   'G',   'na vrchnú žemľu'),
  ('legend', 'Ľadový šalát',                   21,   'G',   'nasekaný'),
  ('legend', 'Čerstvé paradajky',              28,   'G',   '2 plátky'),
  ('legend', 'Kyslá uhorka',                   14,   'G',   '4 plátky'),
  ('legend', 'Cibuľa',                         12,   'G',   'biela, na kolieska'),
  ('legend', 'Kečup',                           14,   'G',   'prémiový, jemný'),

  -- SMOKY
  ('smoky', 'Brioche žemľa',                   1,    'PCS', 'opečená na masle'),
  ('smoky', 'Hovädzia placka',                 200,  'G',   '2 × 100 g surová váha'),
  ('smoky', 'Cheddar',                           2,    'PCS', '2 × 14 g'),
  ('smoky', 'Slanina',                          18,   'G',   'údená, 4 plátky po upečení'),
  ('smoky', 'BBQ omáčka',                       15,   'G',   'prémiová, na vrchnú žemľu'),
  ('smoky', 'Majonéza',                         10,   'G',   'na spodnú žemľu')
) AS ri(product_slug, ingredient_name, quantity, unit, notes)
JOIN products p ON p.slug = ri.product_slug
JOIN recipes r ON r."productId" = p.id
JOIN ingredients i ON i.name = ri.ingredient_name;

COMMIT;
