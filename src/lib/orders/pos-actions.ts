"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/rbac";
import { authorizeStore } from "@/lib/auth/tenancy";
import { OrderStatus, PaymentStatus } from "@/generated/prisma/enums";
import {
  placeOrder,
  updateOrderStatus,
  type PlaceOrderResult,
} from "@/lib/orders/actions";
import { PosOrderSchema } from "@/lib/orders/pos-schemas";

const ADMIN_POS_PATH = "/admin/pokladna";
const ADMIN_ORDERS_PATH = "/admin/objednavky";
const ADMIN_KDS_PATH = "/admin/kuchyna";

/**
 * Vytvorí objednávku z pokladne (staff), potvrdí ju a označí ako zaplatenú.
 * Objednávka ide cez Order API (ak je nakonfigurovaný) a sklad sa odpočíta pri CONFIRMED.
 */
export async function placePosOrder(input: unknown): Promise<PlaceOrderResult> {
  const parsed = PosOrderSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      (fieldErrors[key] ??= []).push(issue.message);
    }
    return { ok: false, message: "Skontroluj zadané údaje.", fieldErrors };
  }

  const data = parsed.data;

  try {
    await authorizeStore(data.storeId, Role.STAFF);
  } catch {
    return { ok: false, message: "Nemáš oprávnenie pre túto predajňu." };
  }

  const created = await placeOrder({
    storeId: data.storeId,
    type: data.type,
    paymentMethod: data.paymentMethod,
    items: data.items,
    customerName: data.customerName,
    note: data.note,
  });

  if (!created.ok) return created;

  const confirmed = await updateOrderStatus(
    created.orderId,
    OrderStatus.CONFIRMED,
  );
  if (!confirmed.ok) {
    return {
      ok: false,
      message: `Objednávka #${created.orderNumber} bola vytvorená, ale nepodarilo sa ju potvrdiť: ${confirmed.message}`,
    };
  }

  await prisma.order.update({
    where: { id: created.orderId },
    data: { paymentStatus: PaymentStatus.PAID },
  });

  revalidatePath(ADMIN_POS_PATH);
  revalidatePath(ADMIN_ORDERS_PATH);
  revalidatePath(ADMIN_KDS_PATH);

  return created;
}
