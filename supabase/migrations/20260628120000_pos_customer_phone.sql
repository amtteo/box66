-- POS customer phone lookup, pending invites, phone loyalty, table number

CREATE TYPE "PendingInviteStatus" AS ENUM ('PENDING', 'COMPLETED', 'EXPIRED');

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS "tableNumber" text;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_unique_idx
  ON public.profiles (phone)
  WHERE phone IS NOT NULL AND phone <> '';

CREATE INDEX IF NOT EXISTS profiles_phone_prefix_idx
  ON public.profiles (phone text_pattern_ops)
  WHERE phone IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.pending_customer_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  phone text NOT NULL UNIQUE,
  "fullName" text,
  "storeId" uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  status "PendingInviteStatus" NOT NULL DEFAULT 'PENDING',
  "profileId" uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  "smsSentAt" timestamptz,
  "smsCount" integer NOT NULL DEFAULT 0,
  "expiresAt" timestamptz NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS pending_customer_invites_phone_idx
  ON public.pending_customer_invites (phone);

CREATE INDEX IF NOT EXISTS pending_customer_invites_token_idx
  ON public.pending_customer_invites (token);

CREATE TABLE IF NOT EXISTS public.phone_loyalty_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  "storeId" uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  balance integer NOT NULL DEFAULT 0,
  "pendingInviteId" uuid REFERENCES public.pending_customer_invites(id) ON DELETE SET NULL,
  "createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (phone, "storeId")
);

CREATE INDEX IF NOT EXISTS phone_loyalty_accounts_phone_idx
  ON public.phone_loyalty_accounts (phone);

CREATE TABLE IF NOT EXISTS public.phone_loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "accountId" uuid NOT NULL REFERENCES public.phone_loyalty_accounts(id) ON DELETE CASCADE,
  type "LoyaltyTxType" NOT NULL,
  points integer NOT NULL,
  "orderId" uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  "createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS phone_loyalty_transactions_account_idx
  ON public.phone_loyalty_transactions ("accountId", "createdAt");

CREATE INDEX IF NOT EXISTS phone_loyalty_transactions_order_idx
  ON public.phone_loyalty_transactions ("orderId");

ALTER TABLE public.pending_customer_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_loyalty_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- place_order: add table number (drop old signature first)
DROP FUNCTION IF EXISTS public.place_order(
  uuid, jsonb, "OrderType", uuid, "PaymentMethod",
  text, text, text, text, text,
  numeric, integer, numeric, numeric, numeric
);

CREATE OR REPLACE FUNCTION public.place_order(
  p_store_id uuid,
  p_items jsonb,
  p_type "OrderType" DEFAULT 'TAKEAWAY',
  p_customer_id uuid DEFAULT NULL,
  p_payment_method "PaymentMethod" DEFAULT NULL,
  p_customer_name text DEFAULT NULL,
  p_customer_email text DEFAULT NULL,
  p_customer_phone text DEFAULT NULL,
  p_note text DEFAULT NULL,
  p_delivery_address text DEFAULT NULL,
  p_delivery_fee numeric DEFAULT 0,
  p_delivery_duration_minutes integer DEFAULT NULL,
  p_delivery_distance_km numeric DEFAULT NULL,
  p_delivery_latitude numeric DEFAULT NULL,
  p_delivery_longitude numeric DEFAULT NULL,
  p_table_number text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_order_id uuid;
  v_order_number integer;
  v_subtotal numeric := 0;
  v_paid_subtotal numeric := 0;
  v_tax_total numeric := 0;
  v_discount_total numeric := 0;
  v_total numeric := 0;
  v_currency text := 'EUR';
  v_item jsonb;
  v_choice jsonb;
  v_menu_item_id uuid;
  v_quantity integer;
  v_unit_price numeric;
  v_line_total numeric;
  v_name_snapshot text;
  v_product_id uuid;
  v_order_item_id uuid;
  v_item_note text;
  v_loyalty_reward_id uuid;
  v_points_redeemed integer;
  v_is_loyalty boolean;
  v_has_loyalty boolean := false;
  v_loyalty_min_paid numeric := 5;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM stores WHERE id = p_store_id AND "isActive" = true) THEN
    RAISE EXCEPTION 'Store not found or inactive: %', p_store_id;
  END IF;

  IF p_customer_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_customer_id) THEN
    RAISE EXCEPTION 'Customer not found: %', p_customer_id;
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item';
  END IF;

  SELECT currency INTO v_currency FROM stores WHERE id = p_store_id;

  UPDATE store_order_counters
  SET "lastNumber" = "lastNumber" + 1
  WHERE "storeId" = p_store_id
  RETURNING "lastNumber" INTO v_order_number;

  IF v_order_number IS NULL THEN
    INSERT INTO store_order_counters ("storeId", "lastNumber")
    VALUES (p_store_id, 1)
    RETURNING "lastNumber" INTO v_order_number;
  END IF;

  v_order_id := gen_random_uuid();

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    v_menu_item_id := (v_item->>'menuItemId')::uuid;
    v_quantity := COALESCE((v_item->>'quantity')::integer, 1);
    v_loyalty_reward_id := NULLIF(v_item->>'loyaltyRewardId', '')::uuid;

    IF v_quantity <= 0 THEN
      RAISE EXCEPTION 'Item quantity must be positive';
    END IF;

    IF v_loyalty_reward_id IS NOT NULL THEN
      v_has_loyalty := true;
      SELECT
        p.id,
        p.name,
        lr."pointsCost" * v_quantity
      INTO v_product_id, v_name_snapshot, v_points_redeemed
      FROM loyalty_rewards lr
      JOIN products p ON p.id = lr."productId"
      JOIN menu_items mi ON mi."productId" = p.id AND mi.id = v_menu_item_id
      JOIN stores s ON s.id = mi."storeId"
      WHERE lr.id = v_loyalty_reward_id
        AND lr."isActive" = true
        AND p."isActive" = true
        AND mi."storeId" = p_store_id
        AND mi."isAvailable" = true;

      IF v_product_id IS NULL THEN
        RAISE EXCEPTION 'Loyalty reward not available: %', v_loyalty_reward_id;
      END IF;

      v_unit_price := 0;
    ELSE
      SELECT
        p.id,
        p.name,
        COALESCE(mi."customPrice", p."basePrice" * pc.multiplier)
      INTO v_product_id, v_name_snapshot, v_unit_price
      FROM menu_items mi
      JOIN products p ON p.id = mi."productId"
      JOIN stores s ON s.id = mi."storeId"
      JOIN price_coefficients pc ON pc.id = s."priceCoefficientId"
      WHERE mi.id = v_menu_item_id
        AND mi."storeId" = p_store_id
        AND mi."isAvailable" = true
        AND p."isActive" = true;

      IF v_product_id IS NULL THEN
        RAISE EXCEPTION 'Menu item not available: %', v_menu_item_id;
      END IF;

      IF v_unit_price IS NULL OR v_unit_price <= 0 THEN
        RAISE EXCEPTION 'Menu item has no valid price: %', v_menu_item_id;
      END IF;

      v_paid_subtotal := v_paid_subtotal + (v_unit_price * v_quantity);
    END IF;

    v_subtotal := v_subtotal + (v_unit_price * v_quantity);
  END LOOP;

  IF v_has_loyalty THEN
    IF p_customer_id IS NULL THEN
      RAISE EXCEPTION 'Customer required for loyalty rewards';
    END IF;
    IF v_paid_subtotal < v_loyalty_min_paid THEN
      RAISE EXCEPTION 'Minimum paid subtotal for loyalty is % EUR', v_loyalty_min_paid;
    END IF;
  END IF;

  v_total := v_subtotal + COALESCE(p_delivery_fee, 0) + v_tax_total - v_discount_total;

  INSERT INTO orders (
    id, "orderNumber", "storeId", "customerId", type, status, "paymentStatus",
    "paymentMethod", subtotal, "taxTotal", "discountTotal", total, currency,
    "customerName", "customerEmail", "customerPhone", note, "tableNumber",
    "deliveryAddress", "deliveryFee", "deliveryDurationMinutes",
    "deliveryDistanceKm", "deliveryLatitude", "deliveryLongitude",
    "placedAt", "createdAt", "updatedAt"
  ) VALUES (
    v_order_id, v_order_number, p_store_id, p_customer_id, p_type, 'PENDING', 'UNPAID',
    p_payment_method, v_subtotal, v_tax_total, v_discount_total, v_total, v_currency,
    p_customer_name, p_customer_email, p_customer_phone, p_note, p_table_number,
    p_delivery_address, COALESCE(p_delivery_fee, 0), p_delivery_duration_minutes,
    p_delivery_distance_km, p_delivery_latitude, p_delivery_longitude,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  );

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    v_menu_item_id := (v_item->>'menuItemId')::uuid;
    v_quantity := COALESCE((v_item->>'quantity')::integer, 1);
    v_item_note := v_item->>'note';
    v_loyalty_reward_id := NULLIF(v_item->>'loyaltyRewardId', '')::uuid;
    v_is_loyalty := v_loyalty_reward_id IS NOT NULL;

    IF v_is_loyalty THEN
      SELECT
        p.id,
        p.name,
        lr."pointsCost" * v_quantity
      INTO v_product_id, v_name_snapshot, v_points_redeemed
      FROM loyalty_rewards lr
      JOIN products p ON p.id = lr."productId"
      JOIN menu_items mi ON mi."productId" = p.id AND mi.id = v_menu_item_id
      WHERE lr.id = v_loyalty_reward_id
        AND mi."storeId" = p_store_id;

      v_unit_price := 0;
    ELSE
      SELECT
        p.id,
        p.name,
        COALESCE(mi."customPrice", p."basePrice" * pc.multiplier)
      INTO v_product_id, v_name_snapshot, v_unit_price
      FROM menu_items mi
      JOIN products p ON p.id = mi."productId"
      JOIN stores s ON s.id = mi."storeId"
      JOIN price_coefficients pc ON pc.id = s."priceCoefficientId"
      WHERE mi.id = v_menu_item_id AND mi."storeId" = p_store_id;

      v_points_redeemed := NULL;
    END IF;

    v_line_total := v_unit_price * v_quantity;
    v_order_item_id := gen_random_uuid();

    INSERT INTO order_items (
      id, "orderId", "menuItemId", "productId", "nameSnapshot",
      "unitPrice", quantity, "lineTotal", note, "isLoyaltyReward", "pointsRedeemed"
    ) VALUES (
      v_order_item_id, v_order_id, v_menu_item_id, v_product_id, v_name_snapshot,
      v_unit_price, v_quantity, v_line_total, v_item_note, v_is_loyalty, v_points_redeemed
    );

    IF v_item ? 'choices' AND jsonb_typeof(v_item->'choices') = 'array' THEN
      FOR v_choice IN SELECT value FROM jsonb_array_elements(v_item->'choices')
      LOOP
        INSERT INTO order_item_choices (
          id, "orderItemId", "groupId", "productId", "menuItemId",
          "groupLabel", "nameSnapshot", "createdAt"
        ) VALUES (
          gen_random_uuid(),
          v_order_item_id,
          NULLIF(v_choice->>'groupId', '')::uuid,
          NULLIF(v_choice->>'productId', '')::uuid,
          NULLIF(v_choice->>'menuItemId', '')::uuid,
          COALESCE(v_choice->>'groupLabel', ''),
          COALESCE(v_choice->>'nameSnapshot', ''),
          CURRENT_TIMESTAMP
        );
      END LOOP;
    END IF;
  END LOOP;

  RETURN v_order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.place_order(
  uuid, jsonb, "OrderType", uuid, "PaymentMethod",
  text, text, text, text, text,
  numeric, integer, numeric, numeric, numeric, text
) TO service_role;
