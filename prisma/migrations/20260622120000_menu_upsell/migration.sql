-- Upsell single produktu na MENU verziu (burger → menu s nápojom)

ALTER TABLE "products" ADD COLUMN "menuUpsellProductId" UUID;

CREATE INDEX "products_menuUpsellProductId_idx" ON "products"("menuUpsellProductId");

ALTER TABLE "products" ADD CONSTRAINT "products_menuUpsellProductId_fkey"
    FOREIGN KEY ("menuUpsellProductId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
