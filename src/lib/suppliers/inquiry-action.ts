"use server";

import { prisma } from "@/lib/prisma";
import {
  flattenZodError,
  rawValues,
  type FormState,
} from "@/lib/forms";
import {
  SUPPLIER_INQUIRY_CATEGORIES,
  SupplierInquirySchema,
} from "@/lib/suppliers/inquiry-schema";

function categoryLabel(value: string) {
  return (
    SUPPLIER_INQUIRY_CATEGORIES.find((c) => c.value === value)?.label ?? value
  );
}

export async function submitSupplierInquiry(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = SupplierInquirySchema.safeParse({
    companyName: formData.get("companyName"),
    ico: formData.get("ico"),
    contactName: formData.get("contactName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    category: formData.get("category"),
    region: formData.get("region"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      errors: flattenZodError(parsed.error),
      values: rawValues(formData),
    };
  }

  const d = parsed.data;

  const notes = [
    "Dopyt z webu — Pre dodávateľov",
    `Kategória: ${categoryLabel(d.category)}`,
    `Región: ${d.region}`,
    "",
    d.description,
  ].join("\n");

  try {
    await prisma.supplier.create({
      data: {
        name: d.companyName,
        ico: d.ico,
        contactName: d.contactName,
        phone: d.phone,
        email: d.email,
        notes,
        isActive: false,
      },
    });
  } catch {
    return {
      ok: false,
      message:
        "Odoslanie sa nepodarilo. Skúste znovu.",
      values: rawValues(formData),
    };
  }

  return {
    ok: true,
    message:
      "Ponuka bola odoslaná. Ďakujeme.",
  };
}
