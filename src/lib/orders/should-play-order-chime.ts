import { OrderStatus } from "@/generated/prisma/enums";

type OrderSnapshot = {
  status?: string | null;
};

/** Rozhodne, či KDS má prehrať zvuk pri realtime udalosti. */
export function shouldPlayOrderChime(
  eventType: "INSERT" | "UPDATE" | "DELETE",
  record: OrderSnapshot | null,
  oldRecord: OrderSnapshot | null,
): boolean {
  if (eventType === "INSERT") return true;

  if (eventType !== "UPDATE" || !record?.status) return false;

  const next = record.status;
  const prev = oldRecord?.status;
  if (next === prev) return false;

  return (
    next === OrderStatus.CONFIRMED || next === OrderStatus.PREPARING
  );
}
