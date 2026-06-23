-- Premenovanie demo merchu na Tričko Hranolky / Hranolky S–XL.

UPDATE "categories"
SET
  "name" = 'Veľkosti Tričko Hranolky',
  "slug" = 'merch-velkosti-tricko-hranolky',
  "description" = 'Skrytý pool veľkostí pre tričko Hranolky.',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "slug" IN ('merch-velkosti-black-tee', 'merch-velkosti-fries-tee')
   OR "id" = 'a0000001-0002-4001-8001-000000000002';

UPDATE "products"
SET
  "name" = 'Tričko Hranolky',
  "description" = 'Vzorové tričko — odmena s výberom veľkosti.',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "slug" = 'black-tee-demo'
   OR "id" = 'a0000002-0001-4001-8001-000000000010';

UPDATE "products" SET "name" = 'Hranolky S', "updatedAt" = CURRENT_TIMESTAMP
WHERE "slug" = 'black-tee-demo-s' OR "id" = 'a0000002-0011-4001-8001-000000000011';

UPDATE "products" SET "name" = 'Hranolky M', "updatedAt" = CURRENT_TIMESTAMP
WHERE "slug" = 'black-tee-demo-m' OR "id" = 'a0000002-0012-4001-8001-000000000012';

UPDATE "products" SET "name" = 'Hranolky L', "updatedAt" = CURRENT_TIMESTAMP
WHERE "slug" = 'black-tee-demo-l' OR "id" = 'a0000002-0013-4001-8001-000000000013';

UPDATE "products" SET "name" = 'Hranolky XL', "updatedAt" = CURRENT_TIMESTAMP
WHERE "slug" = 'black-tee-demo-xl' OR "id" = 'a0000002-0014-4001-8001-000000000014';

UPDATE "ingredients" SET "name" = 'Hranolky S', "updatedAt" = CURRENT_TIMESTAMP
WHERE "name" IN ('Tričko Black Tee S', 'Fries Tee S', 'Black Tee — S', 'Fries Tee — S')
   OR "id" = 'a0000003-0011-4001-8001-000000000011';

UPDATE "ingredients" SET "name" = 'Hranolky M', "updatedAt" = CURRENT_TIMESTAMP
WHERE "name" IN ('Tričko Black Tee M', 'Fries Tee M', 'Black Tee — M', 'Fries Tee — M')
   OR "id" = 'a0000003-0012-4001-8001-000000000012';

UPDATE "ingredients" SET "name" = 'Hranolky L', "updatedAt" = CURRENT_TIMESTAMP
WHERE "name" IN ('Tričko Black Tee L', 'Fries Tee L', 'Black Tee — L', 'Fries Tee — L')
   OR "id" = 'a0000003-0013-4001-8001-000000000013';

UPDATE "ingredients" SET "name" = 'Hranolky XL', "updatedAt" = CURRENT_TIMESTAMP
WHERE "name" IN ('Tričko Black Tee XL', 'Fries Tee XL', 'Black Tee — XL', 'Fries Tee — XL')
   OR "id" = 'a0000003-0014-4001-8001-000000000014';
