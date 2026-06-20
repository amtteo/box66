"use client";

import { toast } from "sonner";
import { Toaster } from "sonner";

import { LogoIcon } from "@/components/brand/logo-icon";
import { formatDeliveryDuration } from "@/lib/delivery/format";
import { formatMoney } from "@/lib/orders/types";

const CART_TOASTER_ID = "cart-added";

function CartAddedToastCard({
  id,
  title,
  detail,
}: {
  id: string | number;
  title: string;
  detail: string;
}) {
  return (
    <div
      role="status"
      className="relative ml-auto w-64 max-w-[calc(100vw-2.5rem)] cursor-default rounded-xl border-2 border-foreground bg-white p-6 custom-shadow mb-6 sm:w-72 sm:p-12"
      onClick={() => toast.dismiss(id)}
    >
      <div className="flex justify-center">
        <LogoIcon className="h-18 mb-6 text-red-500" />
      </div>
      <p className="mt-2 text-center text-lg font-semibold leading-tight text-foreground">
        {title}
      </p>
      <p className="mt-1 text-center text-sm text-foreground">{detail}</p>
      <span
        aria-hidden
        className="absolute -bottom-[9px] right-10 size-4 rotate-45 border-b-2 border-r-2 border-foreground bg-white"
      />
    </div>
  );
}

export function CartAddedToaster() {
  return (
    <Toaster
      id={CART_TOASTER_ID}
      position="bottom-right"
      offset={{ bottom: 88, right: 20 }}
      mobileOffset={{ bottom: 88, right: 20 }}
      visibleToasts={1}
      expand={false}
      closeButton={false}
      className="cart-added-toaster !w-auto max-w-[calc(100vw-2.5rem)] items-end"
      style={{ "--width": "auto" } as React.CSSProperties}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "ml-auto w-auto p-0 bg-transparent border-none shadow-none",
        },
      }}
    />
  );
}

export function showCartAddedToast(itemName: string) {
  toast.custom(
    (id) => (
      <CartAddedToastCard
        id={id}
        title="Pridané do košíka"
        detail={`„${itemName}"`}
      />
    ),
    { toasterId: CART_TOASTER_ID, duration: 3000 },
  );
}

export function showDeliveryAddedToast(
  fee: number,
  currency: string,
  durationMinutes?: number,
) {
  const price = formatMoney(fee, currency);
  const detail =
    durationMinutes != null
      ? `Donáška ${price} · ${formatDeliveryDuration(durationMinutes)}`
      : `Donáška ${price}`;

  toast.custom(
    (id) => (
      <CartAddedToastCard
        id={id}
        title="Donáška pridaná do košíka"
        detail={detail}
      />
    ),
    { toasterId: CART_TOASTER_ID, duration: 3000 },
  );
}
