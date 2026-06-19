-- Doručovacie zóny a polia objednávky pre donášku

CREATE TABLE "delivery_zone_defaults" (
    "id" UUID NOT NULL,
    "minKm" DECIMAL(6,2) NOT NULL,
    "maxKm" DECIMAL(6,2) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_zone_defaults_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "store_delivery_zones" (
    "id" UUID NOT NULL,
    "storeId" UUID NOT NULL,
    "minKm" DECIMAL(6,2) NOT NULL,
    "maxKm" DECIMAL(6,2) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_delivery_zones_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "store_delivery_zones_storeId_idx" ON "store_delivery_zones"("storeId");

ALTER TABLE "store_delivery_zones" ADD CONSTRAINT "store_delivery_zones_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "orders" ADD COLUMN "deliveryFee" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN "deliveryAddress" TEXT;
ALTER TABLE "orders" ADD COLUMN "deliveryDistanceKm" DECIMAL(6,2);

-- Predvolená zóna platformy: 0–6 km za 1,99 €
INSERT INTO "delivery_zone_defaults" ("id", "minKm", "maxKm", "price", "sortOrder", "updatedAt")
VALUES (gen_random_uuid(), 0, 6, 1.99, 0, CURRENT_TIMESTAMP);

-- Existujúce predajne zdedia predvolenú zónu
INSERT INTO "store_delivery_zones" ("id", "storeId", "minKm", "maxKm", "price", "sortOrder", "updatedAt")
SELECT gen_random_uuid(), s."id", 0, 6, 1.99, 0, CURRENT_TIMESTAMP
FROM "stores" s
WHERE NOT EXISTS (
  SELECT 1 FROM "store_delivery_zones" z WHERE z."storeId" = s."id"
);
