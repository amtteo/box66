-- Kolo: kombá s výberom (napr. nápoj k menu)
-- Pridáva príznaky pre „choice pool" kategóriu a kombo-voľbu na produkte,
-- skupiny výberu na kombo produkte a snímky výberu na položkách objednávky.

-- 1) Príznaky na kategórii a produkte
ALTER TABLE "categories" ADD COLUMN "isChoicePool" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "products" ADD COLUMN "isComboOption" BOOLEAN NOT NULL DEFAULT false;

-- 2) Skupiny výberu na kombo produkte
CREATE TABLE "product_choice_groups" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "minSelect" INTEGER NOT NULL DEFAULT 1,
    "maxSelect" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_choice_groups_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "product_choice_groups_productId_idx" ON "product_choice_groups"("productId");
CREATE INDEX "product_choice_groups_categoryId_idx" ON "product_choice_groups"("categoryId");

ALTER TABLE "product_choice_groups" ADD CONSTRAINT "product_choice_groups_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_choice_groups" ADD CONSTRAINT "product_choice_groups_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 3) Snímky výberu na položkách objednávky
CREATE TABLE "order_item_choices" (
    "id" UUID NOT NULL,
    "orderItemId" UUID NOT NULL,
    "groupId" UUID,
    "productId" UUID,
    "menuItemId" UUID,
    "groupLabel" TEXT NOT NULL,
    "nameSnapshot" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_item_choices_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "order_item_choices_orderItemId_idx" ON "order_item_choices"("orderItemId");

ALTER TABLE "order_item_choices" ADD CONSTRAINT "order_item_choices_orderItemId_fkey"
    FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_item_choices" ADD CONSTRAINT "order_item_choices_groupId_fkey"
    FOREIGN KEY ("groupId") REFERENCES "product_choice_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 4) RLS zapnuté (bez politík) — runtime ide cez Prisma (service role), Data API blokované
ALTER TABLE "product_choice_groups" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order_item_choices" ENABLE ROW LEVEL SECURITY;
