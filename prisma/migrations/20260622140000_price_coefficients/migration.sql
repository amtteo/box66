-- Koeficienty cien + centrálne basePrice, customPrice override na menu položkách.

CREATE TABLE "price_coefficients" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "multiplier" DECIMAL(6,4) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_coefficients_pkey" PRIMARY KEY ("id")
);

INSERT INTO "price_coefficients" ("id", "name", "multiplier", "sortOrder", "createdAt", "updatedAt") VALUES
    ('01900001-0001-7000-8000-000000000001', 'Standard', 1.0000, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('01900001-0001-7000-8000-000000000002', 'Premium', 1.1000, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('01900001-0001-7000-8000-000000000003', 'Travel', 1.5000, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

ALTER TABLE "stores" ADD COLUMN "priceCoefficientId" UUID;

UPDATE "stores"
SET "priceCoefficientId" = '01900001-0001-7000-8000-000000000001'
WHERE "priceCoefficientId" IS NULL;

ALTER TABLE "stores" ALTER COLUMN "priceCoefficientId" SET NOT NULL;

ALTER TABLE "stores" ADD CONSTRAINT "stores_priceCoefficientId_fkey"
    FOREIGN KEY ("priceCoefficientId") REFERENCES "price_coefficients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "stores_priceCoefficientId_idx" ON "stores"("priceCoefficientId");

ALTER TABLE "products" RENAME COLUMN "suggestedPrice" TO "basePrice";

ALTER TABLE "menu_items" RENAME COLUMN "price" TO "customPrice";
ALTER TABLE "menu_items" ALTER COLUMN "customPrice" DROP NOT NULL;
UPDATE "menu_items" SET "customPrice" = NULL;
