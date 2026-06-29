-- Mirror of box66admin supabase migration 20260628120000_pos_customer_phone

CREATE TYPE "PendingInviteStatus" AS ENUM ('PENDING', 'COMPLETED', 'EXPIRED');

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "tableNumber" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "profiles_phone_unique_idx"
  ON "profiles" ("phone")
  WHERE phone IS NOT NULL AND phone <> '';

CREATE INDEX IF NOT EXISTS "profiles_phone_prefix_idx"
  ON "profiles" ("phone" text_pattern_ops)
  WHERE phone IS NOT NULL;

CREATE TABLE IF NOT EXISTS "pending_customer_invites" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "token" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "fullName" TEXT,
    "storeId" UUID,
    "status" "PendingInviteStatus" NOT NULL DEFAULT 'PENDING',
    "profileId" UUID,
    "smsSentAt" TIMESTAMP(3),
    "smsCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pending_customer_invites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "pending_customer_invites_token_key" ON "pending_customer_invites"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "pending_customer_invites_phone_key" ON "pending_customer_invites"("phone");
CREATE INDEX IF NOT EXISTS "pending_customer_invites_token_idx" ON "pending_customer_invites"("token");

CREATE TABLE IF NOT EXISTS "phone_loyalty_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "phone" TEXT NOT NULL,
    "storeId" UUID NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "pendingInviteId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "phone_loyalty_accounts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "phone_loyalty_accounts_phone_storeId_key"
  ON "phone_loyalty_accounts"("phone", "storeId");

CREATE TABLE IF NOT EXISTS "phone_loyalty_transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "accountId" UUID NOT NULL,
    "type" "LoyaltyTxType" NOT NULL,
    "points" INTEGER NOT NULL,
    "orderId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "phone_loyalty_transactions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "phone_loyalty_transactions_accountId_createdAt_idx"
  ON "phone_loyalty_transactions"("accountId", "createdAt");

ALTER TABLE "pending_customer_invites" ADD CONSTRAINT "pending_customer_invites_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pending_customer_invites" ADD CONSTRAINT "pending_customer_invites_profileId_fkey"
  FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "phone_loyalty_accounts" ADD CONSTRAINT "phone_loyalty_accounts_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "phone_loyalty_accounts" ADD CONSTRAINT "phone_loyalty_accounts_pendingInviteId_fkey"
  FOREIGN KEY ("pendingInviteId") REFERENCES "pending_customer_invites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "phone_loyalty_transactions" ADD CONSTRAINT "phone_loyalty_transactions_accountId_fkey"
  FOREIGN KEY ("accountId") REFERENCES "phone_loyalty_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "phone_loyalty_transactions" ADD CONSTRAINT "phone_loyalty_transactions_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
