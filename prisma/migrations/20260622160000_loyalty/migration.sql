-- Vernostný program: odmeny, účty zákazníkov a kniha pohybov bodov

CREATE TYPE "LoyaltyTxType" AS ENUM (
    'EARN',
    'REDEEM',
    'EARN_REVERSAL',
    'REDEEM_REVERSAL',
    'ADJUSTMENT'
);

CREATE TABLE "loyalty_rewards" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "pointsCost" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loyalty_rewards_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "loyalty_accounts" (
    "id" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "storeId" UUID NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loyalty_accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "loyalty_transactions" (
    "id" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "type" "LoyaltyTxType" NOT NULL,
    "points" INTEGER NOT NULL,
    "orderId" UUID,
    "rewardId" UUID,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loyalty_transactions_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "order_items" ADD COLUMN "isLoyaltyReward" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "order_items" ADD COLUMN "pointsRedeemed" INTEGER;

CREATE UNIQUE INDEX "loyalty_rewards_productId_key" ON "loyalty_rewards"("productId");

CREATE UNIQUE INDEX "loyalty_accounts_profileId_storeId_key" ON "loyalty_accounts"("profileId", "storeId");
CREATE INDEX "loyalty_accounts_profileId_idx" ON "loyalty_accounts"("profileId");
CREATE INDEX "loyalty_accounts_storeId_idx" ON "loyalty_accounts"("storeId");

CREATE INDEX "loyalty_transactions_accountId_createdAt_idx" ON "loyalty_transactions"("accountId", "createdAt");
CREATE INDEX "loyalty_transactions_orderId_idx" ON "loyalty_transactions"("orderId");

ALTER TABLE "loyalty_rewards" ADD CONSTRAINT "loyalty_rewards_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "loyalty_accounts" ADD CONSTRAINT "loyalty_accounts_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "loyalty_accounts" ADD CONSTRAINT "loyalty_accounts_storeId_fkey"
    FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_accountId_fkey"
    FOREIGN KEY ("accountId") REFERENCES "loyalty_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_rewardId_fkey"
    FOREIGN KEY ("rewardId") REFERENCES "loyalty_rewards"("id") ON DELETE SET NULL ON UPDATE CASCADE;
